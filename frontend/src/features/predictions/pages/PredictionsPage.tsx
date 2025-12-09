import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  PlayIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from '@/components/ui'
import { FileUpload } from '@/components/forms'
import { mlApi, predictionsApi } from '@/api'
import { useToastActions } from '@/contexts'
import { formatNumber } from '@/utils'
import type { SinglePredictionResponse } from '@/types'

export function PredictionsPage() {
  const { modelId } = useParams<{ modelId: string }>()
  const queryClient = useQueryClient()
  const toast = useToastActions()

  const [singleInputs, setSingleInputs] = useState<Record<string, string>>({})
  const [batchFile, setBatchFile] = useState<File | null>(null)
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null)

  const { data: model, isLoading: modelLoading } = useQuery({
    queryKey: ['trained-models', modelId],
    queryFn: () => mlApi.getModel(modelId!),
    enabled: !!modelId,
  })

  const singlePredictMutation = useMutation({
    mutationFn: (inputs: Record<string, unknown>) =>
      predictionsApi.predict({
        model_id: modelId!,
        data: [inputs],
        include_probabilities: true,
      }),
    onSuccess: (data) => {
      setPrediction(data)
      toast.success('Prediction complete', 'Your prediction result is ready.')
    },
    onError: () => {
      toast.error('Prediction failed', 'Could not make the prediction.')
    },
  })

  const batchPredictMutation = useMutation({
    mutationFn: (file: File) =>
      predictionsApi.batchPredict({
        model_id: modelId!,
        file,
        async: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prediction-jobs'] })
      toast.success('Batch prediction started', 'Your predictions are being processed.')
      setBatchFile(null)
    },
    onError: () => {
      toast.error('Batch prediction failed', 'Could not start the batch prediction.')
    },
  })

  const handleSinglePredict = () => {
    if (!model?.feature_columns) return

    const inputs: Record<string, unknown> = {}
    model.feature_columns.forEach((col) => {
      const value = singleInputs[col]
      if (value !== undefined && value !== '') {
        // Try to convert to number if possible
        const numValue = parseFloat(value)
        inputs[col] = isNaN(numValue) ? value : numValue
      }
    })

    singlePredictMutation.mutate(inputs)
  }

  const handleBatchPredict = () => {
    if (!batchFile) return
    batchPredictMutation.mutate(batchFile)
  }

  if (modelLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>
      </div>
    )
  }

  if (!model) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Model not found.</p>
          <Link to="/models">
            <Button variant="secondary">Back to Models</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Get the first prediction from results (since we sent single input)
  const predictionValue = prediction?.predictions?.[0]
  const probabilitiesMap = prediction?.probabilities?.[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/models/${modelId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">Make Predictions</h1>
            <p className="text-secondary mt-1">
              {model.algorithm} • {model.target_column}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single Prediction</TabsTrigger>
          <TabsTrigger value="batch">Batch Prediction</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Input Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {model.feature_columns?.map((col) => (
                    <Input
                      key={col}
                      label={col}
                      value={singleInputs[col] || ''}
                      onChange={(e) =>
                        setSingleInputs((prev) => ({
                          ...prev,
                          [col]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${col}`}
                    />
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSinglePredict}
                    isLoading={singlePredictMutation.isPending}
                    leftIcon={<PlayIcon className="w-5 h-5" />}
                    disabled={Object.values(singleInputs).filter(Boolean).length === 0}
                  >
                    Predict
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction Result</CardTitle>
              </CardHeader>
              <CardContent>
                {prediction && predictionValue !== undefined ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl neu-pressed text-center">
                      <p className="text-sm text-muted mb-1">Predicted Value</p>
                      <p className="text-3xl font-bold text-primary">
                        {typeof predictionValue === 'number'
                          ? formatNumber(predictionValue, 4)
                          : String(predictionValue)}
                      </p>
                    </div>

                    {probabilitiesMap && (
                      <div>
                        <p className="text-sm text-muted mb-2">Class Probabilities</p>
                        <div className="space-y-2">
                          {Object.entries(probabilitiesMap)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cls, prob]) => (
                              <div key={cls} className="flex items-center gap-3">
                                <span className="text-sm text-secondary w-24 truncate">
                                  {cls}
                                </span>
                                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-500"
                                    style={{ width: `${prob * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm text-primary w-16 text-right">
                                  {formatNumber(prob * 100, 1)}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-secondary">
                      Enter values and click Predict to see results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={setBatchFile}
                  onError={(error) => toast.error('File error', error)}
                  isUploading={batchPredictMutation.isPending}
                />

                {batchFile && (
                  <div className="mt-4">
                    <p className="text-sm text-secondary">
                      Selected: <span className="text-primary">{batchFile.name}</span>
                    </p>
                    <Button
                      onClick={handleBatchPredict}
                      isLoading={batchPredictMutation.isPending}
                      leftIcon={<CloudArrowUpIcon className="w-5 h-5" />}
                      className="mt-4 w-full"
                    >
                      Start Batch Prediction
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-secondary">
                  <p>
                    Upload a CSV file with the same columns used for training.
                    The file should contain the following columns:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {model.feature_columns?.map((col) => (
                      <span
                        key={col}
                        className="px-2 py-1 text-xs rounded-lg neu-raised text-muted"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                  <p>
                    The predictions will be added as a new column to your data
                    and made available for download.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PredictionsPage
