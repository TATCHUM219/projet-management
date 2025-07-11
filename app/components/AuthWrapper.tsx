import { FolderGit2 } from 'lucide-react'
import React from 'react'
type WrapperProps = {
    children : React.ReactNode
}

const AuthWrapper = ({children} : WrapperProps ) => {
  return (
    <div className='h-screen flex justify-center items-center flex-col '>
        <div className='flex items-center mb-6'>

            <div className='bg-primary-content text-primary rounded-full p-2'>
              <FolderGit2 className='w-6 h-6' />
            </div>
            <span className='ml-3 font-bold text-3xl'>
                Task <span className='text-primary'>Flow</span>
            </span>

        </div>

        <div>
            {children}
        </div>
    </div>
  )
}

export default AuthWrapper