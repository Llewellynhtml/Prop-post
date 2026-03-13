import React from 'react';
import { Branding } from '../types';
import TemplateLibrary from './TemplateLibrary';
import PageHeader from './PageHeader';

interface Props {
  branding: Branding;
}

export default function Templates({ branding }: Props) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Templates" 
        subtitle="Browse and manage visual templates for your social media posts"
      />
      <TemplateLibrary 
        branding={branding}
        onSelect={(t) => {
          console.log("Selected template:", t);
          // In a real app, we might save this as default for the brand
          alert(`Template "${t.name}" selected as default (simulated).`);
        }}
      />
    </div>
  );
}
