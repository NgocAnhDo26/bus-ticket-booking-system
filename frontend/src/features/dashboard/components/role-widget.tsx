import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type DashboardResponse } from '../types'

type RoleWidgetProps = {
  data: DashboardResponse['roleWidgets']
}

export const RoleWidget = ({ data }: RoleWidgetProps) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>{data.title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {data.items.map((item) => (
        <div key={item.label} className="rounded-card border border-border/50 p-4">
          <p className="text-sm text-text-muted">{item.label}</p>
          <p className="text-2xl font-semibold text-text-base">{item.value}</p>
          {item.helper ? <p className="text-xs text-text-muted">{item.helper}</p> : null}
        </div>
      ))}
    </CardContent>
  </Card>
)

