'use client';

import { useParams } from 'next/navigation';
import AutomationBuilderPage from '../components/AutomationBuilderPage';

export default function EditAutomationPage() {
  const { id } = useParams();
  return <AutomationBuilderPage workflowId={id} />;
}
