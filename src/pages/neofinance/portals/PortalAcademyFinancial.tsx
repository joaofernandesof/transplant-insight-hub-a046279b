/**
 * Portal Academy Financeiro - Dados financeiros educação
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GraduationCap,
  Users,
  TrendingUp,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data
const courses = [
  { id: 1, name: 'Tricologia Avançada', enrollments: 45, revenue: 12500, avgTicket: 278 },
  { id: 2, name: 'Transplante Capilar FUE', enrollments: 28, revenue: 18200, avgTicket: 650 },
  { id: 3, name: 'Mesoterapia Capilar', enrollments: 62, revenue: 8500, avgTicket: 137 },
  { id: 4, name: 'Workshop Práticas', enrollments: 15, revenue: 7500, avgTicket: 500 },
  { id: 5, name: 'Fundamentos NeoHub', enrollments: 120, revenue: 0, avgTicket: 0 },
];

const stats = {
  totalRevenue: 35000,
  totalEnrollments: 270,
  activeCourses: 12,
  avgCompletion: 78,
};

export default function PortalAcademyFinancial() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-pink-500" />
            Academy - Financeiro Educação
          </h1>
          <p className="text-muted-foreground">Receitas de cursos e treinamentos</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/academy">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Academy
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Matrículas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Curso</CardTitle>
          <CardDescription>Performance financeira dos cursos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead className="text-right">Matrículas</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell className="text-right">{course.enrollments}</TableCell>
                  <TableCell className="text-right">
                    {course.avgTicket > 0 ? formatCurrency(course.avgTicket) : <Badge variant="secondary">Grátis</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {course.revenue > 0 ? formatCurrency(course.revenue) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
