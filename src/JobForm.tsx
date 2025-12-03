import React, { useState } from 'react'

export const JobForm: React.FC = () => {
    const [title, setTitle] =  useState('')
    const [company, setCompany] =  useState('')
    const [location, setLocation] =  useState('')
    const [link, setLink] =  useState('')
    const [status, setStatus] =  useState('applied')
    const [description, setDescription] =  useState('')
    const [resume, setResume] =  useState<File | null>(null)

    const submitInputs = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
    }

    return (
        <div className='max-w-2xl text-center'>
            <h2 className='text-2xl font-bold mb-4'>Add New Job</h2>
            
            <form onSubmit={submitInputs} className='space-y-4'>
                <div className='flex items-center gap-4'>
                    <label htmlFor="title" className='text-sm font-medium w-24 shrink-0'>Job Title</label>
                    <input 
                        required
                        onChange={e => setTitle(e.target.value)} 
                        id="title"
                        name="title" 
                        type="text" 
                        placeholder="Title" 
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition"
                    />
                </div>

                <div className='flex items-center gap-4'>
                    <label htmlFor="company" className='text-sm font-medium w-24 shrink-0'>Company</label>
                    <input
                        required
                        onChange={e => setCompany(e.target.value)} 
                        id="company"
                        name="company" 
                        type="text" 
                        placeholder="Name" 
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition"
                    />
                </div>

                <div className='flex items-center gap-4'>
                    <label htmlFor="location" className='text-sm font-medium w-24 shrink-0'>Location</label>
                    <input
                        required
                        onChange={e => setLocation(e.target.value)} 
                        id="location"
                        name="location" 
                        type="text" 
                        placeholder="City, State" 
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition"
                    />
                </div>

                <div className='flex items-center gap-4'>
                    <label htmlFor="link" className='text-sm font-medium w-24 shrink-0'>Job Link</label>
                    <input 
                        required
                        onChange={e => setLink(e.target.value)} 
                        id="link"
                        name="link" 
                        type="url" 
                        placeholder="URL" 
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition"
                    />
                </div>

                <div className='flex gap-4'>
                    <label htmlFor="description" className='text-sm font-medium w-24 shrink-0 pt-3'>Description</label>
                    <textarea 
                        onChange={e => setDescription(e.target.value)} 
                        id="description"
                        name="description" 
                        placeholder="Details" 
                        rows={4}
                        className="flex-1 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition resize-none"
                    ></textarea>
                </div>

                <div className='flex gap-4'>
                    <label htmlFor="resume" className='text-sm font-medium w-24 shrink-0'>Resume</label>
                    <div className='flex-1 border-2 border-dashed border-current rounded-lg p-6 hover:opacity-80 transition'>
                        <label htmlFor="resume" className='flex flex-col items-center justify-center cursor-pointer'>
                            <svg className='w-8 h-8 mb-2 opacity-60' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                            </svg>
                            <span className='font-medium'>Upload</span>
                            <span className='text-sm opacity-60'>{resume?.name || 'Click to select'}</span>
                            <input 
                                onChange={e => setResume(e.target.files?.[0] || null)} 
                                id="resume"
                                name="resume" 
                                type="file" 
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="px-14 py-3 border font-semibold rounded-lg transition mt-3 hover:bg-gray-700 active:bg-gray-800"
                >
                    Add Job
                </button>
            </form>
        </div>
    )
}
