import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, PenTool, Image, Video, Grid3X3, 
  Film, Target, FolderOpen, Clock, Trash2,
  Eye, Download, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner'
import AdCopyGenerator from '../components/content/AdCopyGenerator';
import ImageGenerator from '../components/content/ImageGenerator';
import VideoScriptGenerator from '../components/content/VideoScriptGenerator';
import StoryboardGenerator from '../components/content/StoryboardGenerator';
import VideoGenerator from '../components/content/VideoGenerator';
import MultiPlatformCampaign from '../components/content/MultiPlatformCampaign';

const tools = [
  { id: 'ad-copy', name: 'Ad Copy', icon: PenTool, color: 'from-purple-500 to-pink-500', description: 'Generate compelling ad copy for any platform' },
  { id: 'image', name: 'AI Images', icon: Image, color: 'from-pink-500 to-rose-500', description: 'Create advertising visuals with AI' },
  { id: 'video-script', name: 'Video Script', icon: Video, color: 'from-red-500 to-orange-500', description: 'Write professional video commercial scripts' },
  { id: 'storyboard', name: 'Storyboard', icon: Grid3X3, color: 'from-indigo-500 to-purple-500', description: 'Visualize your video with frame-by-frame storyboards' },
  { id: 'video', name: 'Video Generator', icon: Film, color: 'from-violet-500 to-purple-500', description: 'Generate video content with AI' },
  { id: 'campaign', name: 'Multi-Platform', icon: Target, color: 'from-blue-500 to-indigo-500', description: 'Create cohesive campaigns across platforms' },
];

const contentTypeIcons = {
  ad_copy: PenTool,
  image: Image,
  video_script: Video,
  storyboard: Grid3X3,
  video: Film,
  multi_platform: Target
};

export default function ContentCreator() {
  const [activeTab, setActiveTab] = useState('tools');
  const [activeTool, setActiveTool] = useState(null);
  const [videoScript, setVideoScript] = useState(null);

  const { data: savedContent = [], refetch } = useQuery({
    queryKey: ['adContent'],
    queryFn: () => base44.entities.AdContent.list('-created_date', 50)
  });

  const handleDelete = async (id) => {
    try {
      await base44.entities.AdContent.delete(id);
      toast.success('Content deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleGenerateStoryboard = (script) => {
    setVideoScript(script);
    setActiveTool('storyboard');
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'ad-copy':
        return <AdCopyGenerator onSave={refetch} />;
      case 'image':
        return <ImageGenerator onSave={refetch} />;
      case 'video-script':
        return <VideoScriptGenerator onSave={refetch} onGenerateStoryboard={handleGenerateStoryboard} />;
      case 'storyboard':
        return <StoryboardGenerator script={videoScript} onSave={refetch} />;
      case 'video':
        return <VideoGenerator script={videoScript} onSave={refetch} />;
      case 'campaign':
        return <MultiPlatformCampaign onSave={refetch} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Content Creator</h1>
              <p className="text-slate-500 dark:text-slate-400">Powered by Google Gemini</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl">
            <TabsTrigger value="tools" className="rounded-lg gap-2">
              <Sparkles className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-lg gap-2">
              <FolderOpen className="w-4 h-4" />
              Library
              {savedContent.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedContent.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tools">
            {!activeTool ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool, idx) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card 
                        className="border-0 shadow-sm dark:bg-slate-800 cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
                        onClick={() => setActiveTool(tool.id)}
                      >
                        <CardContent className="p-6">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <tool.icon className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">{tool.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{tool.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Ad Copies', count: savedContent.filter(c => c.content_type === 'ad_copy').length, icon: PenTool, color: 'text-purple-500' },
                    { label: 'Images', count: savedContent.filter(c => c.content_type === 'image').length, icon: Image, color: 'text-pink-500' },
                    { label: 'Video Scripts', count: savedContent.filter(c => c.content_type === 'video_script').length, icon: Video, color: 'text-red-500' },
                    { label: 'Campaigns', count: savedContent.filter(c => c.content_type === 'multi_platform').length, icon: Target, color: 'text-blue-500' },
                  ].map((stat, idx) => (
                    <Card key={idx} className="border-0 shadow-sm dark:bg-slate-800">
                      <CardContent className="p-4 flex items-center gap-3">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <div>
                          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.count}</p>
                          <p className="text-xs text-slate-500">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => {
                    setActiveTool(null);
                    setVideoScript(null);
                  }}>
                    ← Back to Tools
                  </Button>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {tools.find(t => t.id === activeTool)?.name}
                  </h2>
                </div>
                {renderTool()}
              </div>
            )}
          </TabsContent>

          <TabsContent value="library">
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-slate-400" />
                  Content Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedContent.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 mb-4">No saved content yet</p>
                    <Button onClick={() => setActiveTab('tools')} className="bg-gradient-to-r from-purple-600 to-pink-600">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Your First Content
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedContent.map((content, idx) => {
                      const Icon = contentTypeIcons[content.content_type] || FolderOpen;
                      return (
                        <motion.div
                          key={content.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 dark:text-white truncate">{content.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {content.content_type?.replace('_', ' ')}
                              </Badge>
                              {content.platform && (
                                <Badge variant="secondary" className="text-xs capitalize">{content.platform}</Badge>
                              )}
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(content.created_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              content.status === 'approved' ? 'bg-green-100 text-green-700' :
                              content.status === 'published' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }>
                              {content.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDelete(content.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}