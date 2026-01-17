import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_hours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  is_featured: boolean;
  order_index: number;
  created_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

export interface ModuleLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'text' | 'pdf' | 'quiz';
  content_url: string | null;
  content_html: string | null;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}

export interface LessonQuiz {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text';
  options: string[];
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

export interface UserEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  watch_time_seconds: number;
}

export interface CourseWithProgress extends Course {
  enrollment?: UserEnrollment;
  modules?: CourseModuleWithLessons[];
  totalLessons?: number;
  completedLessons?: number;
}

export interface CourseModuleWithLessons extends CourseModule {
  lessons: ModuleLessonWithProgress[];
}

export interface ModuleLessonWithProgress extends ModuleLesson {
  progress?: UserLessonProgress;
  quiz?: LessonQuiz;
}

export function useUniversity() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithProgress | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<ModuleLessonWithProgress | null>(null);
  const { user, isAdmin } = useAuth();

  // Fetch all published courses
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });

      if (coursesError) throw coursesError;

      // Fetch user enrollments if logged in
      let userEnrollments: UserEnrollment[] = [];
      if (user) {
        const { data: enrollData, error: enrollError } = await supabase
          .from('user_course_enrollments')
          .select('*')
          .eq('user_id', user.id);
        
        if (!enrollError && enrollData) {
          userEnrollments = enrollData as UserEnrollment[];
          setEnrollments(userEnrollments);
        }
      }

      // Merge courses with enrollments
      const coursesWithEnrollment = (coursesData || []).map(course => ({
        ...course,
        enrollment: userEnrollments.find(e => e.course_id === course.id)
      })) as CourseWithProgress[];

      setCourses(coursesWithEnrollment);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch course details with modules, lessons, and progress
  const fetchCourseDetails = useCallback(async (courseId: string) => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch all lessons for these modules
      const moduleIds = (modulesData || []).map(m => m.id);
      let lessonsData: ModuleLesson[] = [];
      
      if (moduleIds.length > 0) {
        const { data, error } = await supabase
          .from('module_lessons')
          .select('*')
          .in('module_id', moduleIds)
          .order('order_index', { ascending: true });
        
        if (!error) lessonsData = data as ModuleLesson[];
      }

      // Fetch user progress for these lessons
      let progressData: UserLessonProgress[] = [];
      if (user && lessonsData.length > 0) {
        const lessonIds = lessonsData.map(l => l.id);
        const { data, error } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        
        if (!error) progressData = data as UserLessonProgress[];
      }

      // Fetch enrollment
      let enrollment: UserEnrollment | undefined;
      if (user) {
        const { data } = await supabase
          .from('user_course_enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();
        
        if (data) enrollment = data as UserEnrollment;
      }

      // Build course with modules and lessons
      const modulesWithLessons: CourseModuleWithLessons[] = (modulesData || []).map(module => ({
        ...module,
        lessons: lessonsData
          .filter(l => l.module_id === module.id)
          .map(lesson => ({
            ...lesson,
            progress: progressData.find(p => p.lesson_id === lesson.id)
          }))
      }));

      const totalLessons = lessonsData.length;
      const completedLessons = progressData.filter(p => p.is_completed).length;

      const courseWithDetails: CourseWithProgress = {
        ...courseData,
        difficulty: courseData.difficulty as 'beginner' | 'intermediate' | 'advanced',
        enrollment,
        modules: modulesWithLessons,
        totalLessons,
        completedLessons
      };

      setSelectedCourse(courseWithDetails);
      return courseWithDetails;
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Erro ao carregar detalhes do curso');
      return null;
    }
  }, [user]);

  // Enroll in a course
  const enrollInCourse = async (courseId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Faça login para se inscrever');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'enrolled'
        });

      if (error) throw error;

      toast.success('Inscrição realizada com sucesso!');
      await fetchCourses();
      return true;
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Erro ao se inscrever no curso');
      return false;
    }
  };

  // Mark lesson as completed
  const markLessonCompleted = async (lessonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: existing } = await supabase
        .from('user_lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_lesson_progress')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            is_completed: true,
            completed_at: new Date().toISOString()
          });
      }

      // Update course progress
      if (selectedCourse) {
        await updateCourseProgress(selectedCourse.id);
        await fetchCourseDetails(selectedCourse.id);
      }

      toast.success('Aula concluída!');
      return true;
    } catch (error) {
      console.error('Error marking lesson completed:', error);
      toast.error('Erro ao marcar aula como concluída');
      return false;
    }
  };

  // Start/update lesson progress
  const startLesson = async (lessonId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: existing } = await supabase
        .from('user_lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('user_lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId
          });
      }

      // Update enrollment status to in_progress
      if (selectedCourse?.enrollment?.status === 'enrolled') {
        await supabase
          .from('user_course_enrollments')
          .update({ status: 'in_progress' })
          .eq('id', selectedCourse.enrollment.id);
      }

      return true;
    } catch (error) {
      console.error('Error starting lesson:', error);
      return false;
    }
  };

  // Update course progress percentage
  const updateCourseProgress = async (courseId: string) => {
    if (!user) return;

    try {
      // Get all lessons for this course
      const { data: modules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!modules || modules.length === 0) return;

      const moduleIds = modules.map(m => m.id);

      const { data: lessons } = await supabase
        .from('module_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!lessons || lessons.length === 0) return;

      const lessonIds = lessons.map(l => l.id);

      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds);

      const progressPercent = Math.round(((progress?.length || 0) / lessons.length) * 100);
      const isCompleted = progressPercent === 100;

      await supabase
        .from('user_course_enrollments')
        .update({
          progress_percent: progressPercent,
          status: isCompleted ? 'completed' : 'in_progress',
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId);

    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  // Admin: Create course
  const createCourse = async (data: Partial<Course>): Promise<string | null> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar cursos');
      return null;
    }

    try {
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnail_url,
          duration_hours: data.duration_hours || 0,
          difficulty: data.difficulty || 'beginner',
          is_published: data.is_published || false,
          is_featured: data.is_featured || false,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Curso criado com sucesso!');
      await fetchCourses();
      return newCourse.id;
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Erro ao criar curso');
      return null;
    }
  };

  // Admin: Create module
  const createModule = async (courseId: string, title: string, description?: string): Promise<string | null> => {
    if (!isAdmin) return null;

    try {
      const { data: newModule, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title,
          description
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Módulo criado!');
      return newModule.id;
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Erro ao criar módulo');
      return null;
    }
  };

  // Admin: Create lesson
  const createLesson = async (moduleId: string, data: Partial<ModuleLesson>): Promise<string | null> => {
    if (!isAdmin) return null;

    try {
      const { data: newLesson, error } = await supabase
        .from('module_lessons')
        .insert({
          module_id: moduleId,
          title: data.title,
          description: data.description,
          content_type: data.content_type || 'video',
          content_url: data.content_url,
          content_html: data.content_html,
          duration_minutes: data.duration_minutes || 0,
          is_preview: data.is_preview || false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Aula criada!');
      return newLesson.id;
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Erro ao criar aula');
      return null;
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    enrollments,
    isLoading,
    selectedCourse,
    selectedLesson,
    setSelectedCourse,
    setSelectedLesson,
    fetchCourses,
    fetchCourseDetails,
    enrollInCourse,
    markLessonCompleted,
    startLesson,
    createCourse,
    createModule,
    createLesson,
  };
}
