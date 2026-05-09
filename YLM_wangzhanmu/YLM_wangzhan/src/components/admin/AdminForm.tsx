import React, { useState, FormEvent } from 'react';

type AdminFormField = {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'textarea';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

type AdminFormProps = {
  fields: AdminFormField[];
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  submitText?: string;
  className?: string;
};

export default function AdminForm({
  fields,
  onSubmit,
  loading,
  submitText = '提交',
  className = '',
}: AdminFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-lg font-medium text-zinc-700">
            {field.label}
            {field.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
          ) : (
            <input
              type={field.type}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              className="mt-2 block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required={field.required}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '提交中...' : submitText}
      </button>
    </form>
  );
}
