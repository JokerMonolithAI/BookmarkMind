import { Card } from '@/components/ui/card'

export function BookmarkStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">总书签数</h3>
        <p className="mt-2 text-3xl font-bold">123</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">本周新增</h3>
        <p className="mt-2 text-3xl font-bold">12</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">已分类</h3>
        <p className="mt-2 text-3xl font-bold">78%</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">知识图谱</h3>
        <p className="mt-2 text-3xl font-bold">5</p>
      </Card>
    </div>
  )
} 