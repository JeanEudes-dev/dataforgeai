import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  SkeletonTable,
} from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { datasetsApi } from "@/api";
import { useToastActions } from "@/contexts";
import { formatDateTime, formatColumnType, downloadFile } from "@/utils";

export function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastActions();

  const {
    data: dataset,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["datasets", id],
    queryFn: () => datasetsApi.get(id!),
    enabled: !!id,
  });

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["datasets", id, "preview"],
    queryFn: () => datasetsApi.preview(id!, 20),
    enabled: !!id && dataset?.status === "ready",
  });

  const handleDownload = async () => {
    try {
      const blob = await datasetsApi.download(id!);
      downloadFile(blob, dataset?.original_filename || "dataset.csv");
      toast.success("Download started", "Your file is downloading.");
    } catch {
      toast.error("Download failed", "Could not download the file.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">
            Dataset not found or failed to load.
          </p>
          <Button variant="secondary" onClick={() => navigate("/datasets")}>
            Back to Datasets
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/datasets">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-muted-foreground">
                {dataset.name}
              </h1>
              <StatusBadge status={dataset.status} />
            </div>
            <p className="text-secondary mt-1">
              {dataset.description || "No description"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownload}>
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Download
          </Button>
          {dataset.status === "ready" && (
            <>
              <Link to={`/datasets/${id}/eda`}>
                <Button variant="secondary">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Analyze
                </Button>
              </Link>
              <Link to={`/datasets/${id}/train`}>
                <Button>
                  <CpuChipIcon className="w-5 h-5 mr-2" />
                  Train Model
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>File Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-secondary">
                      Original Filename
                    </dt>
                    <dd className="text-muted-foreground ">
                      {dataset.original_filename}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary">
                      File Type
                    </dt>
                    <dd className="text-muted-foreground  uppercase">
                      {dataset.file_type}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary">
                      File Size
                    </dt>
                    <dd className="text-muted-foreground ">
                      {dataset.file_size_display}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary">
                      Uploaded
                    </dt>
                    <dd className="text-muted-foreground ">
                      {formatDateTime(dataset.created_at)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dataset Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-secondary">Rows</dt>
                    <dd className="text-muted-foreground ">
                      {dataset.row_count?.toLocaleString() || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary">
                      Columns
                    </dt>
                    <dd className="text-muted-foreground ">
                      {dataset.column_count || "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary">
                      Status
                    </dt>
                    <dd>
                      <StatusBadge status={dataset.status} />
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview (First 20 rows)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {previewLoading ? (
                <SkeletonTable rows={5} columns={5} />
              ) : preview ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle dark:border-subtle">
                      {preview.columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-subtle dark:border-subtle last:border-0"
                      >
                        {preview.columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-3 text-secondary dark:text-secondary"
                          >
                            {String(row[col] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-secondary dark:text-secondary text-center py-8">
                  Preview not available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Column Schema</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {dataset.columns.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle dark:border-subtle">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary">
                        #
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary">
                        Column
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary">
                        Nullable
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary">
                        Null %
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground dark:text-primary">
                        Unique
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.columns.map((col) => (
                      <tr
                        key={col.id}
                        className="border-b border-subtle dark:border-subtle last:border-0"
                      >
                        <td className="px-4 py-3 text-muted dark:text-muted">
                          {col.position + 1}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground font-medium">
                          {col.name}
                        </td>
                        <td className="px-4 py-3 text-secondary dark:text-secondary">
                          {formatColumnType(col.dtype)}
                        </td>
                        <td className="px-4 py-3 text-secondary dark:text-secondary">
                          {col.nullable ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3 text-secondary dark:text-secondary">
                          {(col.null_ratio * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-secondary dark:text-secondary">
                          {col.unique_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-secondary dark:text-secondary text-center py-8">
                  Schema not available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DatasetDetailPage;
