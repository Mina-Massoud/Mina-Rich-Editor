import React from "react";

interface APITableProps {
  headers: string[];
  rows: string[][];
  className?: string;
}

export function APITable({ headers, rows, className = "" }: APITableProps) {
  return (
    <div className={`border border-border bg-muted overflow-x-auto ${className}`}>
      <table className="w-full min-w-[500px]">
        <thead className="border-b border-border bg-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 text-left text-sm font-medium text-foreground/80">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`p-3 text-sm ${
                    j === 0
                      ? "font-mono text-foreground"
                      : j === 1
                        ? "font-mono text-muted-foreground"
                        : j === 2 && headers.length === 4
                          ? "font-mono text-muted-foreground"
                          : "text-muted-foreground"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
