"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Project, User } from "@/type";
import { toast } from "react-toastify";
import Wrapper from "@/app/components/Wrapper";

// Définition du type Message utilisé dans la messagerie
interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender?: User;
  receiver?: User;
}

// Ajout d'un utilitaire pour détecter les messages diffusés (même contenu, même date, même expéditeur, plusieurs destinataires)
function groupBroadcastMessages(messages: Message[]) {
  const grouped: { [key: string]: Message[] } = {};
  messages.forEach((msg) => {
    const key = `${msg.content}|${msg.createdAt}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(msg);
  });
  return grouped;
}

const MessagingPage = () => {
  const { user } = useUser();
  const userId = user?.id;
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [members, setMembers] = useState<User[]>([]);
  const [receiverId, setReceiverId] = useState<string>("");
  const [content, setContent] = useState("");
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [broadcast, setBroadcast] = useState(false);

  // Charger les projets de l'utilisateur
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    setLoadingProjects(true);
    console.log('Chargement des projets pour:', user.primaryEmailAddress.emailAddress);
    
    fetch(`/api/user/${user.primaryEmailAddress.emailAddress}/projects`)
      .then(res => {
        console.log('Réponse API projets:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Données projets reçues:', data);
        setProjects(data.projects || []);
      })
      .catch(error => {
        console.error('Erreur lors du chargement des projets:', error);
      })
      .finally(() => {
        setLoadingProjects(false);
      });
  }, [user?.primaryEmailAddress?.emailAddress]);

  // Charger les membres du projet sélectionné
  useEffect(() => {
    if (!selectedProject) return;
    fetch(`/api/project/${selectedProject}`)
      .then(res => res.json())
      .then(data => setMembers(data.users || []));
  }, [selectedProject]);

  // Charger les messages reçus/envoyés
  useEffect(() => {
    if (!userId || !selectedProject) return;
    setLoading(true);
    fetch(`/api/message/received?userId=${userId}&projectId=${selectedProject}`)
      .then(res => res.json())
      .then(messages => {
        setReceivedMessages(messages);
        // Marquer les messages non lus comme lus
        messages.forEach(async (msg) => {
          if (!msg.read) {
            await fetch(`/api/message/${msg.id}/read`, { method: 'PUT' });
          }
        });
      })
      .finally(() => setLoading(false));
    fetch(`/api/message/sent?userId=${userId}&projectId=${selectedProject}`)
      .then(res => res.json())
      .then(setSentMessages);
  }, [userId, selectedProject]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !selectedProject) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (!broadcast && !receiverId) {
      toast.error("Veuillez sélectionner un destinataire ou activer la diffusion");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: userId, receiverId, projectId: selectedProject, content, broadcast })
    });
    if (res.ok) {
      toast.success(broadcast ? "Message diffusé à tout le projet" : "Message envoyé");
      setContent("");
      setReceiverId("");
      setBroadcast(false);
      // Refresh messages
      fetch(`/api/message/sent?userId=${userId}&projectId=${selectedProject}`)
        .then(res => res.json())
        .then(setSentMessages);
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'envoi");
    }
    setLoading(false);
  };

  return (
    <Wrapper>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
      <div className="mb-4 flex gap-2">
        <select className="select select-bordered" value={selectedProject} onChange={e => setSelectedProject(e.target.value)} disabled={loadingProjects}>
          <option value="">
            {loadingProjects ? "Chargement des projets..." : "Sélectionner un projet"}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {loadingProjects && <div className="loading loading-spinner loading-sm"></div>}
      </div>
      {projects.length === 0 && !loadingProjects && (
        <div className="alert alert-info">
          <span>Aucun projet trouvé. Vous devez être membre d&apos;au moins un projet pour utiliser la messagerie.</span>
        </div>
      )}
      {selectedProject && (
        <>
          <form className="mb-6 card bg-base-100 p-4" onSubmit={handleSend}>
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              <select className="select select-bordered flex-1" value={receiverId} onChange={e => setReceiverId(e.target.value)} disabled={broadcast}>
                <option value="">Destinataire</option>
                {members.filter(m => m.id !== userId).map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
              <textarea className="textarea textarea-bordered flex-1" value={content} onChange={e => setContent(e.target.value)} placeholder="Votre message..." />
              <button className="btn btn-primary" type="submit" disabled={loading}>Envoyer</button>
            </div>
            <div className="form-control mt-2">
              <label className="label cursor-pointer">
                <span className="label-text">Diffuser à tout le projet</span>
                <input type="checkbox" className="checkbox checkbox-primary ml-2" checked={broadcast} onChange={e => setBroadcast(e.target.checked)} />
              </label>
            </div>
          </form>
          <div className="tabs tabs-boxed mb-4">
            <a className={`tab${tab === 'received' ? ' tab-active' : ''}`} onClick={() => setTab('received')}>Reçus</a>
            <a className={`tab${tab === 'sent' ? ' tab-active' : ''}`} onClick={() => setTab('sent')}>Envoyés</a>
          </div>
          <div>
            {tab === 'received' && (
              <div>
                <h2 className="font-semibold mb-2">Messages reçus</h2>
                {loading ? <div>Chargement...</div> : (
                  <ul className="space-y-2">
                    {receivedMessages.length === 0 && <li>Aucun message reçu.</li>}
                    {receivedMessages.map((msg) => (
                      <li key={msg.id} className="card bg-base-200 p-3">
                        <div className="text-sm text-gray-500">De : {msg.sender?.name || msg.sender?.email}</div>
                        <div>{msg.content}</div>
                        <div className="text-xs text-right text-gray-400">{new Date(msg.createdAt).toLocaleString('fr-FR')}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {tab === 'sent' && (
              <div>
                <h2 className="font-semibold mb-2">Messages envoyés</h2>
                {loading ? <div>Chargement...</div> : (
                  <ul className="space-y-2">
                    {sentMessages.length === 0 && <li>Aucun message envoyé.</li>}
                    {Object.entries(groupBroadcastMessages(sentMessages)).map(([key, msgs]) => (
                      <li key={key} className="card bg-base-200 p-3">
                        {msgs.length > 1 ? (
                          <>
                            <div className="text-sm text-primary font-bold mb-1">Message diffusé à {msgs.length} membres</div>
                            <div>{msgs[0].content}</div>
                            <div className="text-xs text-right text-gray-400">{new Date(msgs[0].createdAt).toLocaleString('fr-FR')}</div>
                            <div className="text-xs text-gray-500 mt-1">Destinataires : {msgs.map(m => m.receiver?.name || m.receiver?.email).join(', ')}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-500">À : {msgs[0].receiver?.name || msgs[0].receiver?.email}</div>
                            <div>{msgs[0].content}</div>
                            <div className="text-xs text-right text-gray-400">{new Date(msgs[0].createdAt).toLocaleString('fr-FR')}</div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </Wrapper>
  );
};

export default MessagingPage; 