"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRADES, SECTIONS } from "@/lib/domain/grades";
import { SPECIALTIES } from "@/lib/domain/specialty";
import { deleteStudentAction, saveStudentAction } from "@/server/actions/students";

type Year = { id: string; name: string };
type Student = {
  id?: string;
  fullName: string;
  idCard: string;
  grade: string;
  section: string;
  specialty: string;
  status: string;
  academicYearId: string;
};

const STATUSES = [
  ["ACTIVE", "Activo"],
  ["INACTIVE", "Inactivo"],
  ["GRADUATED", "Graduado"],
  ["WITHDRAWN", "Retirado"],
] as const;

export function StudentEditor({
  student,
  years,
  grades,
  canDelete,
}: {
  student: Student;
  years: Year[];
  grades: string[];
  canDelete?: boolean;
}) {
  const [state, action, pending] = useActionState(saveStudentAction, null);
  const options = [...new Set([...GRADES, ...grades, student.grade].filter(Boolean))];
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {student.id ? <input type="hidden" name="id" value={student.id} /> : null}
      <div className="sm:col-span-2">
        <Label htmlFor="fullName">Apellido y nombre</Label>
        <Input id="fullName" name="fullName" className="mt-1.5" required defaultValue={student.fullName} />
      </div>
      <div>
        <Label htmlFor="idCard">Cédula</Label>
        <Input id="idCard" name="idCard" className="mt-1.5" inputMode="numeric" defaultValue={student.idCard} placeholder="Opcional" />
      </div>
      <div>
        <Label htmlFor="academicYearId">Año lectivo</Label>
        <select id="academicYearId" name="academicYearId" className="mt-1.5 h-11 w-full rounded-md border border-line bg-white px-3 text-sm" defaultValue={student.academicYearId}>
          {years.map((year) => (
            <option key={year.id} value={year.id}>
              {year.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="grade">Curso</Label>
        <select id="grade" name="grade" className="mt-1.5 h-11 w-full rounded-md border border-line bg-white px-3 text-sm" defaultValue={student.grade}>
          {options.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="section">Paralelo</Label>
        <select id="section" name="section" className="mt-1.5 h-11 w-full rounded-md border border-line bg-white px-3 text-sm" defaultValue={student.section}>
          <option value="">Sin paralelo</option>
          {SECTIONS.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="specialty">Especialidad</Label>
        <select id="specialty" name="specialty" className="mt-1.5 h-11 w-full rounded-md border border-line bg-white px-3 text-sm" defaultValue={student.specialty}>
          <option value="">Sin especialidad</option>
          {SPECIALTIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="status">Estado</Label>
        <select id="status" name="status" className="mt-1.5 h-11 w-full rounded-md border border-line bg-white px-3 text-sm" defaultValue={student.status}>
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {state?.error ? <p className="text-sm text-danger sm:col-span-2">{state.error}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : student.id ? "Actualizar estudiante" : "Crear estudiante"}
        </Button>
        {student.id && canDelete ? (
          <button className="ml-3 text-sm text-danger" formAction={deleteStudentAction} type="submit">
            Eliminar
          </button>
        ) : null}
      </div>
    </form>
  );
}
