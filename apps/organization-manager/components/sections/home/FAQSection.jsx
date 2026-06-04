'use client'

import { Accordion, Container, Section } from '@webfudge/ui'
import { SectionHeader } from '../../common'

const faqs = [
  {
    id: 'data-safety',
    question: 'Is my data safe with Greenway Mobility?',
    answer:
      'Yes. We use industry-grade encryption, secure servers, and role-based access controls to protect your data at all times.',
  },
  {
    id: 'get-started',
    question: 'How do I get started?',
    answer:
      'Sign up for a free trial, set up your organization, and invite your team. You can start using project management and fleet operations within minutes.',
  },
  {
    id: 'upgrade',
    question: 'Can I upgrade to new features later?',
    answer:
      'Absolutely. You can change your plan or add modules anytime. New features are rolled out regularly and available based on your subscription.',
  },
  {
    id: 'how-it-works',
    question: 'How does it work?',
    answer:
      'Greenway Mobility brings your fleet operations, project management, and accounts into one platform. Use the tools you need, integrate with your systems, and scale as you grow.',
  },
]

const accordionItems = faqs.map((faq) => ({
  id: faq.id,
  label: faq.question,
  content: <p>{faq.answer}</p>,
}))

export default function FAQSection() {
  return (
    <Section id="faq" ariaLabel="Frequently asked questions">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <div>
            <SectionHeader
              tagText="FAQs"
              title="Frequently Asked Questions"
              subtitle="Get answers to common questions here."
            />
          </div>

          <Accordion items={accordionItems} defaultOpenId={faqs[0].id} variant="default" />
        </div>
      </Container>
    </Section>
  )
}
