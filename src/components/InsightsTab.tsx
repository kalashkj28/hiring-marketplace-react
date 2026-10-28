import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, TrendingUp, BarChart2 } from 'lucide-react';

interface InsightItem {
  id: number;
  title: string;
  numbers: string;
  why: string;
  recommendation: string;
  measure: string;
}

export const InsightsTab: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const toggle = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const findings: InsightItem[] = [
    {
      id: 1,
      title: '1. Tier-3 cities apply at a much lower rate',
      numbers:
        'Tier-2: 22.0% view-to-apply vs Tier-3: 15.2% - a gap of 6.8 percentage points',
      why: 'Likely reasons: listings may not be in local languages, fewer verified employers (lower trust), and less relevant job supply in smaller cities.',
      recommendation:
        "Start by auditing the 3-4 worst Tier-3 cities - check if listings have a language version in the seeker's preferred language. If not, that's probably the first thing to fix.",
      measure: 'Track View to Apply % for the pilot cities week on week.',
    },
    {
      id: 2,
      title: '2. Verified employers respond 2.5x more than unverified ones',
      numbers:
        'Verified: 57.4% response rate | Unverified: 22.2% - a massive 35.2pp gap',
      why: 'Verified employers are probably more serious about hiring. Unverified might be posting jobs without actually being ready to hire.',
      recommendation:
        "Add an in-app prompt after a job goes live: 'Complete verification to rank higher in seeker search results.' Also consider suppressing unverified postings from top search results.",
      measure:
        'Response rate for newly verified employers - compare the 30 days before and after verification.',
    },
    {
      id: 3,
      title: '3. Delivery & Logistics is the slowest category to respond',
      numbers:
        'D&L avg: 70.5h to first response vs Sales: 33.0h - more than 2x slower',
      why: "These are usually small fleet operators or local businesses. They probably check the app once a day at most, and don't have a dedicated HR team.",
      recommendation:
        "Send an auto-acknowledgement to the seeker within 1 hour of applying (so they don't feel ignored). Nudge the recruiter with a notification at 24h if they haven't responded.",
      measure:
        '% of D&L applications responded to within 24h. Currently this is very low.',
    },
    {
      id: 4,
      title: '4. Weekend job postings get weaker recruiter response',
      numbers:
        'Weekday postings: 46.0% response rate | Weekend: 36.6% - 9.4pp lower',
      why: "Recruiters (especially at small businesses) probably don't check the app on weekends. Applications pile up and some seekers move on before Monday.",
      recommendation:
        "If an employer posts on a Saturday/Sunday, push their job live on Monday morning instead. This ensures the posting gets recruiter attention when they're actually online.",
      measure:
        "Compare response rate for weekend-posted jobs that are 'delayed to Monday' vs live immediately.",
    },
    {
      id: 5,
      title: '5. WhatsApp Share brings the most intent-driven seekers',
      numbers:
        'WhatsApp Share: 25.1% view-to-apply | Paid Ads: 15.7% - a 9.4pp gap',
      why: "When a friend shares a job on WhatsApp, there's an implicit endorsement. Seekers from paid ads are often just browsing and not ready to apply.",
      recommendation:
        "Invest more in referral/share loops - 'Share this job with a friend' inside the app. For paid ads, tighten targeting to city + language + category instead of broad demographics.",
      measure:
        'Cost per application by channel. WhatsApp referral CAC is almost certainly lower than paid ads.',
    },
    {
      id: 6,
      title: '6. Nagpur had a sharp 2-week dip in July (needs investigation)',
      numbers:
        'Nagpur view-to-apply dropped to ~6-9% in weeks of Jul 13 and Jul 20, vs its normal range of 17-30%',
      why: 'Could be a tracking/data issue, a paused campaign, a drop in employer supply, or something local. Other comparable cities did not show the same dip (e.g. Nashik went from 22.7% to 24.4%, Patna went from 24.4% to 23.0% during the same 15 days).',
      recommendation:
        'Before assuming it is demand-side - check the data pipeline first. Then break down by channel and category to isolate where the drop came from.',
      measure:
        "Watch Nagpur's weekly view-to-apply % for the next 4 weeks. If it normalises, it was probably a one-time event.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Key findings and what I would recommend</h3>
        <p className="text-xs text-slate-500 mt-1">
          These are the six most interesting patterns discovered in the hiring data. Numbers match the SQL
          reconciliation queries.
        </p>
      </div>

      <div className="space-y-4">
        {findings.map((f) => {
          const isExpanded = expandedIds.includes(f.id);
          return (
            <div
              key={f.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(f.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center border border-teal-200">
                    {f.id}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-800">{f.title}</h4>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <BarChart2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Numbers: </span>
                      <span className="text-slate-800 font-medium">{f.numbers}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Why this is happening (hypothesis): </span>
                      <span>{f.why}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">What I would recommend: </span>
                      <span className="text-slate-800">{f.recommendation}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">How to measure the impact: </span>
                      <span>{f.measure}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-lg text-[11px] text-slate-500 text-center">
        All data is synthetic - generated with Python (seed=42). Patterns were designed into the dataset to simulate
        real marketplace dynamics. Dashboard validated against SQL queries - headline numbers match exactly.
      </div>
    </div>
  );
};
