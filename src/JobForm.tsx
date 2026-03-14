import React, { useState } from 'react'
import { addJob } from './controller'
import { EmploymentType, JobStatus } from './interfaces'
import { GOOGLE_CONFIG } from '../config/googleConfig'

export const JobForm: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);

    const [title, setTitle] =  useState('');
    const [company, setCompany] =  useState('');
    const [location, setLocation] =  useState('');
    const [link, setLink] =  useState('');
    const [description, setDescription] =  useState('');
    const [status, setStatus] = useState<JobStatus>('Applied');
    const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time')
    const [extraDetails, setExtraDetails] = useState('');


    const submitInputs = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);


        const job = {
            title,
            company,
            location,
            link,
            status,
            description,
            employmentType,
            extraDetails,
        };

        try {
            await addJob(job);

            setTitle('');
            setCompany('');
            setLocation('');
            setLink('');
            setDescription('');
            setStatus('Applied');
            setEmploymentType('Full-time');
            setExtraDetails('');
            
            setAdded(true);
            setTimeout(() => setAdded(false), 3000);
        }
        catch (err) {
            setError('Failed to save. Check your credentials.');
        }
        finally {
            setLoading(false);
        }

    }

    const openSheet = () => {
        const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_CONFIG.spreadsheetId}`;
        chrome.tabs.create({ url });
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
                        value={title}
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
                        value={company}
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
                        value={location}
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
                        value={link}
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition"
                    />
                </div>

                <div className='flex items-center gap-4'>
                    <label htmlFor="status" className='text-sm font-medium w-24 shrink-0'>Status</label>
                    <select
                        id="status"
                        name="status"
                        value={status}
                        onChange={e => setStatus(e.target.value as JobStatus)}
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition bg-transparent"
                    >
                        <option value="Applied">Applied</option>
                        <option value="Phone Screen">Phone Screen</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                    </select>
                </div>

                <div className='flex items-center gap-4'>
                    <label htmlFor="employmentType" className='text-sm font-medium w-24 shrink-0'>Type</label>
                    <select
                        id="employmentType"
                        name="employmentType"
                        value={employmentType}
                        onChange={e => setEmploymentType(e.target.value as EmploymentType)}
                        className="flex-1 min-w-0 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition bg-transparent"
                    >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Casual">Casual</option>
                    </select>
                </div>

                <div className='flex gap-4'>
                    <label htmlFor="description" className='text-sm font-medium w-24 shrink-0 pt-3'>Description</label>
                    <textarea 
                        onChange={e => setDescription(e.target.value)} 
                        id="description"
                        name="description" 
                        placeholder="Details"
                        value={description}
                        rows={4}
                        className="flex-1 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition resize-none"
                    ></textarea>
                </div>

                <div className='flex gap-4'>
                    <label htmlFor="extraDetails" className='text-sm font-medium w-24 shrink-0 pt-3'>Extra Details</label>
                    <textarea
                        onChange={e => setExtraDetails(e.target.value)}
                        id="extraDetails"
                        name="extraDetails"
                        placeholder="Salary, notes, referrals..."
                        value={extraDetails}
                        rows={3}
                        className="flex-1 px-4 py-3 border border-current rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1 transition resize-none"
                    ></textarea>
                </div>

                <div className='flex justify-evenly'>
                    <button 
                        type="submit"
                        disabled={loading}
                        className={`px-14 py-3 border font-semibold rounded-lg transition mt-3 active:bg-gray-800 ${ loading ? 'bg-gray-800 hover:bg-gray-800' : 'hover:bg-gray-700' } ${added ? 'text-green-700 font-bold' : ''}`}
                    >
                        {added ? 'Added!' : loading ? 'Adding...' : 'Add Job'}
                    </button>

                    <button 
                        type='button' 
                        onClick={openSheet}
                        className="px-14 py-3 border font-semibold rounded-lg transition mt-3 bg-blue-500 hover:bg-blue-700 active:bg-blue-800"
                    >
                        Show Jobs
                    </button>
                </div>
            </form>
        </div>
    )
}
