import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { InsightsPanel } from '@/components/charts'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import type { EnhancedReport } from '@/types'

interface InsightsSectionProps {
  report: EnhancedReport
}

export function InsightsSection({ report }: InsightsSectionProps) {
  const eda = report.content?.eda
  const insights = eda?.insights || []
  const aiInsights = eda?.ai_insights
  const aiSummary = report.ai_summary

  const hasAnyContent = insights.length > 0 || aiInsights || aiSummary

  if (!hasAnyContent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No insights available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* AI Summary */}
      {aiSummary && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm">
                AI
              </span>
              AI-generated summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={aiSummary} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights from EDA */}
      {aiInsights && aiInsights !== aiSummary && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="text-base">AI analysis insights</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={aiInsights} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated Insights */}
      {insights.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Key findings</CardTitle>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {insights.length} insight{insights.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <InsightsPanel insights={insights} />
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <CardTitle className="text-base">Report summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryTile label="Rows analyzed" value={report.content?.dataset?.row_count?.toLocaleString() || 'N/A'} />
            <SummaryTile label="Columns" value={report.content?.dataset?.column_count || 'N/A'} />
            <SummaryTile label="Models trained" value={report.report_metadata?.models_count || 0} />
            <SummaryTile label="Insights found" value={insights.length} />
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Note */}
      {eda?.data_quality_score !== undefined && (
        <div className="flex items-center justify-center">
          <div
            className={`px-4 py-3 rounded-xl border ${
              eda.data_quality_score >= 80
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : eda.data_quality_score >= 60
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            <p
              className="text-sm font-medium"
            >
              Data Quality Score: <strong>{eda.data_quality_score.toFixed(0)}/100</strong>
              {eda.data_quality_score >= 80
                ? ' - Excellent data quality for analysis'
                : eda.data_quality_score >= 60
                ? ' - Moderate data quality, consider data cleaning'
                : ' - Low data quality, significant cleaning recommended'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default InsightsSection

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.12)] text-center">
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  )
}
