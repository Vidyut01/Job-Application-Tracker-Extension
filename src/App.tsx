import React from 'react'
import { JobForm } from './JobForm'

export const App: React.FC = () => {

    return (
        <div className='w-full h-full p-10'>
            <div className="w-full text-center mb-4">
                <h1 className='text-2xl font-bold'>Job Application Tracker</h1>
                <br />
                <button className='bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white py-2 px-4 rounded'>View Saved Jobs</button>
            </div>
            <JobForm />
        </div>
    )
}
