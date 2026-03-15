import React from "react";

interface APITableProps {
  headers: string[];
  rows: string[][];
  className?: string;
}

export function APITable({ headers, rows, className = "" }: APITableProps) {
  return (
    <div className={`border border-border-subtle bg-surface-raised overflow-x-auto ${className}`}>
      <table className="w-full min-w-[500px]">
        <thead className="border-b border-border-subtle bg-white/[0.02]">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 text-left text-sm font-medium text-warm-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`p-3 text-sm ${
                    j === 0
                      ? "font-mono text-warm-100"
                      : j === 1
                        ? "font-mono text-warm-400"
                        : j === 2 && headers.length === 4
                          ? "font-mono text-warm-400"
                          : "text-warm-300"
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
