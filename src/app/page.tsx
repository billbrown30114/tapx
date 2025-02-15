"use client";

import { useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DynamoDBService } from '@/services/dynamoDBService';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  console.log('id', id);

  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whereWeMet, setWhereWeMet] = useState('');
  const [position, setPosition] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit');
    debugger; 

    e.preventDefault();
    console.log('Resume ID:', id);
    const viewer = {
      email,
      company,
      phone,
      whereWeMet,
      position,
    }
    try {
      // First send the email
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(viewer)
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send email');
      }

      const url = `https://s3.us-east-1.amazonaws.com/ingress.tapx/updates/`+id+`/resume.pdf`;
      console.log('email sent, looking for resume', url);

      // Then get the resume URL
      if (id) {
        const resumeResponse = await fetch(`https://s3.us-east-1.amazonaws.com/ingress.tapx/updates/{id}/resume.pdf`);
        if (!resumeResponse.ok) {
          console.log('resumeResponse', resumeResponse);
          throw new Error('Failed to fetch resume');
        }
        
        const { url } = await resumeResponse.json();
        console.log('Received S3 URL:', url);
        
        if (url) {
          toast.success('Accessing resume...');
          // Clear form before navigation
          setEmail('');
          setCompany('');
          setPhone('');
          setWhereWeMet('');
          setPosition('');
          
          console.log('persing viewer', viewer);
          new DynamoDBService().persist({ viewedBy: viewer}); 
          router.push(url);
        } else {
          throw new Error('No resume found');
        }
      }

    } catch (error) {
      console.log('Error:', error);
      toast.error('Failed to process request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Access Resume
          </h1>
          <p className="text-lg sm:text-xl text-gray-400">
            Please provide your information to view {id ? `${id}'s` : 'the'} resume
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} 
          className="bg-[#2a2a2a]/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 
            border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-200" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full p-3 bg-[#1a1a1a] rounded-lg border border-gray-600 text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  placeholder:text-gray-500"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Company Field */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-200" htmlFor="company">
                Company
              </label>
              <input
                className="w-full p-3 bg-[#1a1a1a] rounded-lg border border-gray-600 text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  placeholder:text-gray-500"
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Current company"
                required
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-200" htmlFor="phone">
                Phone Number
              </label>
              <input
                className="w-full p-3 bg-[#1a1a1a] rounded-lg border border-gray-600 text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                  placeholder:text-gray-500"
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>

            {/* Where We Met Field */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-200" htmlFor="whereWeMet">
                Where We Met
              </label>
              <select
                className="w-full p-3 bg-[#1a1a1a] rounded-lg border border-gray-600 text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                id="whereWeMet"
                value={whereWeMet}
                onChange={(e) => setWhereWeMet(e.target.value)}
                required
              >
                <option value="">Select an option</option>
                <option value="conference">Conference</option>
                <option value="online">Online</option>
                <option value="referral">Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Position Field - Full Width */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-200" htmlFor="position">
              Potential Position
            </label>
            <input
              className="w-full p-3 bg-[#1a1a1a] rounded-lg border border-gray-600 text-white
                focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                placeholder:text-gray-500"
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Position you think I'd be a good fit for"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold 
              py-4 px-4 rounded-lg transition-all hover:from-blue-600 hover:to-blue-700 
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#2a2a2a]
              shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            View Resume
          </button>
        </form>

        {/* Footer Text */}
        <p className="mt-8 text-center text-gray-400 text-sm">
          Your information will only be used for professional communication purposes.
        </p>
      </div>
    </div>
  );
}
