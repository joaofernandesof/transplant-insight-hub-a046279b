/**
 * EditableText - Campo de texto editável inline
 * Clique para editar, blur para salvar
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export function EditableText({
  value,
  onChange,
  className,
  style,
  placeholder = "Clique para editar...",
  multiline = false,
  disabled = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <span className={className} style={style}>
        {value || placeholder}
      </span>
    );
  }

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: localValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        setLocalValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      className: cn(
        "bg-white/90 border border-primary/30 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-primary/20",
        className
      ),
      style: { 
        ...style, 
        minWidth: "100px",
        width: "100%",
      },
      placeholder,
    };

    if (multiline) {
      return (
        <textarea
          {...commonProps}
          rows={3}
          className={cn(commonProps.className, "resize-none")}
        />
      );
    }

    return <input type="text" {...commonProps} />;
  }

  return (
    <span
      className={cn(
        "cursor-pointer hover:bg-primary/5 rounded px-1 py-0.5 transition-colors inline-block",
        !value && "text-muted-foreground italic",
        className
      )}
      style={style}
      onClick={() => setIsEditing(true)}
      title="Clique para editar"
    >
      {value || placeholder}
    </span>
  );
}

interface EditableNumberProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  disabled?: boolean;
}

export function EditableNumber({
  value,
  onChange,
  className,
  style,
  prefix = "",
  disabled = false,
}: EditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(localValue.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!isNaN(numValue) && numValue !== value) {
      onChange(numValue);
    } else {
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(value.toString());
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <span className={className} style={style}>
        {prefix}{value.toLocaleString("pt-BR")}
      </span>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-white/90 border border-primary/30 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-primary/20 w-24",
          className
        )}
        style={style}
      />
    );
  }

  return (
    <span
      className={cn(
        "cursor-pointer hover:bg-white/20 rounded px-1 py-0.5 transition-colors inline-block",
        className
      )}
      style={style}
      onClick={() => setIsEditing(true)}
      title="Clique para editar"
    >
      {prefix}{value.toLocaleString("pt-BR")}
    </span>
  );
}
