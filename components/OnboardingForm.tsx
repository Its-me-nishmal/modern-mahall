import React, { useState } from 'react';
import { Home, User, MapPin, Calendar, Phone } from 'lucide-react';

interface OnboardingFormProps {
    phone: string;
    onSubmit: (data: {
        headName: string;
        address: string;
        ward: string;
        age: number;
        gender: 'Male' | 'Female';
    }) => void;
    onCancel: () => void;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({ phone, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        headName: '',
        address: '',
        ward: 'Ward 1',
        age: 30,
        gender: 'Male' as 'Male' | 'Female'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Home className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome to Modern Mahall</h2>
                    <p className="text-gray-500 text-sm mt-2">Let's set up your family profile</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <User className="w-4 h-4 inline mr-1" />
                            Full Name (Head of Family)
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.headName}
                            onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Address
                        </label>
                        <textarea
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter your address"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={formData.ward}
                                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                            >
                                <option>Ward 1</option>
                                <option>Ward 2</option>
                                <option>Ward 3</option>
                                <option>Ward 4</option>
                                <option>Ward 5</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Age
                            </label>
                            <input
                                type="number"
                                required
                                min="18"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="gender"
                                    checked={formData.gender === 'Male'}
                                    onChange={() => setFormData({ ...formData, gender: 'Male' })}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-sm">Male</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="gender"
                                    checked={formData.gender === 'Female'}
                                    onChange={() => setFormData({ ...formData, gender: 'Female' })}
                                    className="w-4 h-4 text-emerald-600"
                                />
                                <span className="text-sm">Female</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            disabled
                            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                            value={phone}
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <p className="font-medium mb-1">📋 Note:</p>
                        <p>Your family profile will be pending admin approval. You'll be notified once approved.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg"
                        >
                            Create Family Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OnboardingForm;
