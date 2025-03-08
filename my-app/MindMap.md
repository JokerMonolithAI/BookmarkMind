# BookmarkMind 脑图视图开发文档

## 需求概述

为 BookmarkMind 智能书签管理平台开发脑图视图功能，使用户能够以思维导图的形式可视化查看和管理书签内容。脑图视图将按照书签的分类（category）组织，支持全局视图和分类视图的切换。

## 界面区域划分

### 1. 系统图标区域
- **位置**：顶部工具栏的左侧
- **功能**：显示系统图标（logo或系统名称）
- **样式**：与现有顶部工具栏保持一致

### 2. 左侧导航区
- **位置**：系统图标区域下方，整个页面的左侧
- **内容**：按照书签的category进行组织
- **结构**：
  - "我的脑图"：系统默认的第一个选项，点击后显示全部书签的总脑图
  - 其他category：根据当前用户数据去重展示，点击后显示该category下的分支脑图
- **功能**：
  - 支持category的重命名
  - 支持category的删除
  - 当重命名或删除category时，将更新对应书签的category字段

### 3. 右侧脑图区域
- **变更**：移除当前的统计信息区（"总书签数"、"本周新增"、"已分类"、"知识图谱"）
- **目的**：扩大脑图展示面积，提供更宽敞的可视化空间
- **内容**：根据左侧导航选择显示相应的脑图

## 脑图呈现方式

### 基本结构
- **结构类型**：放射状结构（以中心节点向外辐射）
- **未来扩展**：计划后续支持用户自定义展示形式
- **节点内容**：显示标题、主要内容、核心概念
- **层级深度**：最多三层结构的脑图

### 交互功能
- **节点展开/折叠**：支持
- **拖拽调整位置**：不支持
- **缩放和平移**：支持

### 脑图组织逻辑
- **总脑图**：中心节点为"我的书签"，一级节点为各个category
- **分类脑图**：中心节点为选中的category，一级节点为该category下的书签
- **节点层级**：
  - 第一层：分类或书签标题
  - 第二层：主要内容或关键点
  - 第三层：核心概念或详细信息

## 技术实现

### 技术选型
- **前端框架**：Next.js 14 (App Router)
- **脑图可视化库**：react-flow
- **状态管理**：React Context API
- **数据存储**：Firebase Realtime Database

### 数据加载策略
- **加载方式**：按需加载
- **实现方法**：
  - 初始只加载第一层节点
  - 用户展开节点时动态加载下一层数据
  - 使用缓存减少重复请求

### 数据结构转换
- **书签数据**：从Firebase获取的原始书签数据
- **脑图数据**：转换为react-flow所需的节点(nodes)和连线(edges)格式
- **转换逻辑**：
  ```javascript
  // 示例转换逻辑
  function convertToMindMapData(bookmarks, selectedCategory = null) {
    // 创建中心节点
    const centerNode = {
      id: 'center',
      type: 'centerNode',
      data: { 
        label: selectedCategory || '我的书签' 
      },
      position: { x: 0, y: 0 }
    };
    
    const nodes = [centerNode];
    const edges = [];
    
    // 根据选择的视图类型处理数据
    if (selectedCategory) {
      // 分类视图：显示该分类下的书签
      // ...处理逻辑
    } else {
      // 总视图：显示所有分类
      // ...处理逻辑
    }
    
    return { nodes, edges };
  }
  ```

## 实现步骤

### 1. 布局调整
- 修改现有布局，移除统计信息区域
- 扩大脑图展示区域
- 保留左侧导航和顶部工具栏

### 2. 导航区实现
- 从数据库获取用户的所有书签
- 提取并去重所有category
- 在导航区显示"我的脑图"和所有category
- 为每个category项添加重命名和删除功能
- 实现category重命名和删除的数据库更新逻辑

### 3. 脑图区实现
- 集成react-flow库
- 创建自定义节点组件，适应放射状布局
- 实现数据转换逻辑，将书签数据转换为脑图数据
- 实现节点的展开/折叠功能
- 实现脑图的缩放和平移功能

### 4. 数据处理
- 实现按需加载逻辑
- 处理category重命名和删除的数据更新
- 优化数据缓存，提高性能

## 组件结构

```
components/
├── mindmap/
│   ├── MindMapView.tsx         # 脑图视图主组件
│   ├── MindMapNavigation.tsx   # 左侧导航组件
│   ├── MindMapCanvas.tsx       # 脑图画布组件
│   ├── nodes/                  # 自定义节点组件
│   │   ├── CenterNode.tsx      # 中心节点
│   │   ├── CategoryNode.tsx    # 分类节点
│   │   └── BookmarkNode.tsx    # 书签节点
│   └── utils/                  # 工具函数
│       ├── dataTransformer.ts  # 数据转换
│       └── layoutCalculator.ts # 布局计算
```

## API 接口

### 获取书签数据
```typescript
// 获取所有书签
async function getAllBookmarks(userId: string): Promise<Bookmark[]> {
  // 实现逻辑
}

// 获取特定分类的书签
async function getCategoryBookmarks(userId: string, category: string): Promise<Bookmark[]> {
  // 实现逻辑
}
```

### 更新分类数据
```typescript
// 重命名分类
async function renameCategory(userId: string, oldName: string, newName: string): Promise<void> {
  // 实现逻辑
}

// 删除分类
async function deleteCategory(userId: string, category: string): Promise<void> {
  // 实现逻辑
}
```

## 后续优化计划

1. **性能优化**：
   - 实现虚拟滚动，处理大量节点的情况
   - 优化渲染性能，减少不必要的重渲染

2. **功能扩展**：
   - 支持多种脑图布局（树状、组织结构等）
   - 添加节点搜索功能
   - 实现脑图导出功能（图片、PDF等）

3. **用户体验提升**：
   - 添加引导提示
   - 优化移动端适配
   - 增加键盘快捷键支持

## 开发计划

1. **第一阶段**：基础结构实现
   - 完成布局调整
   - 实现基本导航功能
   - 集成react-flow，显示简单脑图

2. **第二阶段**：核心功能实现
   - 完成数据转换逻辑
   - 实现节点展开/折叠
   - 实现缩放和平移

3. **第三阶段**：功能完善
   - 实现category重命名和删除
   - 优化数据加载策略
   - 完善错误处理和边界情况

4. **第四阶段**：测试和优化
   - 进行性能测试
   - 修复bug
   - 优化用户体验 