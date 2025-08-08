import React from "react";

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      {children}
    </h1>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
      {children}
      The People of the Kingdom
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
      {children}
    </h3>
  );
}

export function H4({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  );
}

export function H5({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="scroll-m-20 text-lg font-medium tracking-tight">
      {children}
    </h4>
  );
}

export function H6({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="scroll-m-20 text-base font-normal tracking-tight">
      {children}
    </h4>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>;
}

export function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-xl text-muted-foreground">{children}</p>;
}

export function Large({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-semibold">{children}</div>;
}

export function Small({ children }: { children: React.ReactNode }) {
  return <small className="text-sm font-medium leading-none">{children}</small>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-1 font-mono text-sm font-semibold">
      {children}
    </code>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted px-1 font-mono text-sm">{children}</code>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
}

export function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
}

export function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold">{children}</strong>;
}

export function Em({ children }: { children: React.ReactNode }) {
  return <em className="italic">{children}</em>;
}
