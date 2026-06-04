'use client'

import { useState, useEffect, useMemo } from 'react'
import meetingService from '../../lib/api/meetingService'
import {
  MeetingsCard,
  groupUpcomingMeetings,
  MEETINGS_LIMIT,
} from './leadsMeetingsShared'

export default function UpcomingMeetingsWidget({ className = '' }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const nowIso = new Date().toISOString()
        const paramsUpcoming = {
          sort: 'startTime:asc',
          'pagination[pageSize]': 40,
          populate: ['deal', 'clientAccount', 'leadCompany', 'contact'],
          filters: {
            status: { $eq: 'scheduled' },
            startTime: { $gte: nowIso },
          },
        }
        let meetingsRes
        try {
          meetingsRes = await meetingService.getAll(paramsUpcoming)
        } catch {
          meetingsRes = await meetingService.getAll({
            sort: 'startTime:asc',
            'pagination[pageSize]': 60,
            populate: ['deal', 'clientAccount', 'leadCompany', 'contact'],
          })
        }
        if (cancelled) return
        const raw = Array.isArray(meetingsRes?.data) ? meetingsRes.data : []
        const upcoming = raw
          .filter((m) => {
            if (m?.status && m.status !== 'scheduled') return false
            const t = m?.startTime ? new Date(m.startTime).getTime() : 0
            return !Number.isNaN(t) && t > Date.now()
          })
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, MEETINGS_LIMIT)
        setMeetings(upcoming)
      } catch (e) {
        console.error('UpcomingMeetingsWidget:', e)
        if (!cancelled) setMeetings([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const meetingGroups = useMemo(() => groupUpcomingMeetings(meetings), [meetings])

  return <MeetingsCard loading={loading} meetingGroups={meetingGroups} className={className} />
}
