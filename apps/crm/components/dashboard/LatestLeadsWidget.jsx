'use client'

import { useState, useEffect } from 'react'
import leadCompanyService from '../../lib/api/leadCompanyService'
import { LatestLeadsCard, LEADS_LIMIT } from './leadsMeetingsShared'

/** Org-wide latest leads (Sales / Manager sidebar). */
export default function LatestLeadsWidget({ className = '' }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await leadCompanyService.getAll({
          sort: 'createdAt:desc',
          'pagination[pageSize]': LEADS_LIMIT,
        })
        if (!cancelled) setLeads(Array.isArray(res?.data) ? res.data : [])
      } catch (e) {
        console.error('LatestLeadsWidget:', e)
        if (!cancelled) setLeads([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <LatestLeadsCard loading={loading} leads={leads} className={className} />
}
