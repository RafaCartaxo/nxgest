import { useTranslation } from "react-i18next"
import { Activity, GitPullRequest, Bot } from "lucide-react"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { useRuns, usePRs, useDependabot } from "../hooks/useDevBoard.js"
import { RunsList } from "../components/RunsList.js"
import { PRsList } from "../components/PRsList.js"
import { DependabotList } from "../components/DependabotList.js"

export function DevBoardPage() {
  const { t } = useTranslation()
  const runs = useRuns(10)
  const prs = usePRs()
  const dependabot = useDependabot()

  const runsOk = runs.data?.filter((r) => r.status === "completed" && r.conclusion === "success").length ?? 0
  const runsFail = runs.data?.filter((r) => r.status === "completed" && r.conclusion === "failure").length ?? 0

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <PageHeader
        icon={Activity}
        title={t("devboard.titulo")}
        subtitle={t("devboard.subtitulo")}
        eyebrow={t("devboard.eyebrow")}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title={t("devboard.kpiRuns")} value={runs.data?.length ?? "—"} variant="info" />
        <KpiCard title={t("devboard.kpiOk")} value={runsOk} variant="green" />
        <KpiCard title={t("devboard.kpiFalhas")} value={runsFail} variant={runsFail > 0 ? "danger" : "green"} />
        <KpiCard title={t("devboard.kpiPRs")} value={prs.data?.length ?? "—"} variant="info" />
      </div>

      <section className="mb-8">
        <SectionHeader title={t("devboard.runsTitulo")} />
        <RunsList
          runs={runs.data ?? []}
          loading={runs.isLoading}
          error={runs.isError ? (runs.error as Error).message : null}
          onRetry={() => runs.refetch()}
        />
      </section>

      <section className="mb-8">
        <SectionHeader title={t("devboard.prsTitulo")} />
        <PRsList
          prs={prs.data ?? []}
          loading={prs.isLoading}
          error={prs.isError ? (prs.error as Error).message : null}
          onRetry={() => prs.refetch()}
        />
      </section>

      <section className="mb-8">
        <SectionHeader title={t("devboard.dependabotTitulo")} />
        <DependabotList
          dependabot={dependabot.data ?? []}
          loading={dependabot.isLoading}
          error={dependabot.isError ? (dependabot.error as Error).message : null}
          onRetry={() => dependabot.refetch()}
        />
      </section>
    </div>
  )
}
