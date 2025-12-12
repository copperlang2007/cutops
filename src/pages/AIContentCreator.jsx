import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, PenTool, Image, Video, Grid3X3, Film,
  Layers, Clock, Trash2, Eye, MoreVertical, Folder
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import AdCopyGenerator from '@/components/content/AdCopyGenerator';
import ImageGenerator from '@/components/content/ImageGenerator';
import VideoScriptGenerator from '@/components/content/VideoScriptGenerator';
import StoryboardGenerator from '@/components/content/StoryboardGenerator';
import VideoGenerator from '@/components/content/VideoGenerator';

const contentTypeIcons = {
  ad_copy: PenTool,
  image: Image,
  video_script: Video,
  storyboard: Grid3X3,
  video: Film,
  multi_platform: Layers
};

const contentTypeColors = {
  ad_copy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  image: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  video_script: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  storyboard: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  video: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  multi_platform: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
};

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-blue-100 text-blue-700',
  archived: 'bg-slate-100 text-slate-500'
};

export default function AIContentCreator() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ad-copy');
  const [currentScript, setCurrentScript] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const { data: savedContent = [] } = useQuery({
    queryKey: ['adContent'],
    queryFn: () => base44.entities.AdContent.list('-created_date', 50)
  });

  const handleSave = () => {
    queryClient.invalidateQueries(['adContent']);
  };

  const handleGenerateStoryboard = (script) => {
    setCurrentScript(script);
    setActiveTab('storyboard');
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.AdContent.delete(id);
      queryClient.invalidateQueries(['adContent']);
      toast.success('Content deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const recentContent = savedContent.slice(0, 5);
  const contentByType = {
    ad_copy: savedContent.filter(c => c.content_type === 'ad_copy'),
    image: savedContent.filter(c => c.content_type === 'image'),
    video_script: savedContent.filter(c => c.content_type === 'video_script'),
    storyboard: savedContent.filter(c => c.content_type === 'storyboard'),
    video: savedContent.filter(c => c.content_type === 'video'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-500" />
              AI Content Creator
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Generate ads, images, and videos with Google Gemini AI
            </p>
          </div>
          <Button
            variant={showLibrary ? 'default' : 'outline'}
            onClick={() => setShowLibrary(!showLibrary)}
            className={showLibrary ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <Folder className="w-4 h-4 mr-2" />
            Content Library ({savedContent.length})
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(contentByType).map(([type, items]) => {
            const Icon = contentTypeIcons[type];
            return (
              <Card key={type} className="border-0 shadow-sm dark:bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${contentTypeColors[type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{items.length}</p>
                      <p className="text-xs text-slate-500 capitalize">{type.replace('_', ' ')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {showLibrary ? (
          /* Content Library View */
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-purple-500" />
                Saved Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedContent.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No content created yet. Start generating!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedContent.map((content, idx) => {
                    const Icon = contentTypeIcons[content.content_type] || PenTool;
                    return (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl border dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${contentTypeColors[content.content_type] || 'bg-slate-100'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white truncate">
                            {content.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={statusColors[content.status] || statusColors.draft}>
                              {content.status}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {content.platform && <Badge variant="outline" className="mr-2">{content.platform}</Badge>}
                              {format(new Date(content.created_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {content.tags?.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(content.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
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
        ) : (
          /* Creator View */
          <>
            {/* Recent Content */}
            {recentContent.length > 0 && (
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Recent Creations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {recentContent.map((content) => {
                      const Icon = contentTypeIcons[content.content_type] || PenTool;
                      return (
                        <div
                          key={content.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 min-w-[200px] shrink-0"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${contentTypeColors[content.content_type] || 'bg-slate-100'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                              {content.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(content.created_date), 'MMM d')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl h-auto flex-wrap gap-1">
                <TabsTrigger value="ad-copy" className="rounded-lg gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                  <PenTool className="w-4 h-4" />
                  Ad Copy
                </TabsTrigger>
                <TabsTrigger value="image" className="rounded-lg gap-2 data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
                  <Image className="w-4 h-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="video-script" className="rounded-lg gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                  <Video className="w-4 h-4" />
                  Video Script
                </TabsTrigger>
                <TabsTrigger value="storyboard" className="rounded-lg gap-2 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
                  <Grid3X3 className="w-4 h-4" />
                  Storyboard
                </TabsTrigger>
                <TabsTrigger value="video" className="rounded-lg gap-2 data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
                  <Film className="w-4 h-4" />
                  Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ad-copy" className="mt-6">
                <AdCopyGenerator onSave={handleSave} />
              </TabsContent>

              <TabsContent value="image" className="mt-6">
                <ImageGenerator onSave={handleSave} />
              </TabsContent>

              <TabsContent value="video-script" className="mt-6">
                <VideoScriptGenerator 
                  onSave={handleSave} 
                  onGenerateStoryboard={handleGenerateStoryboard}
                />
              </TabsContent>

              <TabsContent value="storyboard" className="mt-6">
                <StoryboardGenerator 
                  script={currentScript}
                  onSave={handleSave} 
                />
              </TabsContent>

              <TabsContent value="video" className="mt-6">
                <VideoGenerator 
                  script={currentScript}
                  onSave={handleSave} 
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}