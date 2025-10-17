"use client";

import React, { useState, useRef } from "react";
import {
  ContainerNode,
  StructuralNode,
  TextNode,
  type EditorNode,
} from "../lib/types";
import { Button } from "./ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableBuilderProps {
  node: ContainerNode;
  onUpdate: (id: string, updates: Partial<EditorNode>) => void;
  readOnly?: boolean;
  onBlockDragStart?: (nodeId: string) => void;
}

export function TableBuilder({
  node,
  onUpdate,
  readOnly = false,
  onBlockDragStart,
}: TableBuilderProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [showColControls, setShowColControls] = useState(false);
  const [showRowControls, setShowRowControls] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [draggingCol, setDraggingCol] = useState<number | null>(null);
  const [draggingRow, setDraggingRow] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [dragOverRow, setDragOverRow] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Helper to find table structure
  const table = node.children.find((child) => child.type === "table") as
    | StructuralNode
    | undefined;
  if (!table) return null;

  const thead = table.children.find((child) => child.type === "thead") as
    | StructuralNode
    | undefined;
  const tbody = table.children.find((child) => child.type === "tbody") as
    | StructuralNode
    | undefined;

  const headerRow = thead?.children[0] as StructuralNode | undefined;
  const bodyRows = tbody?.children as StructuralNode[] | undefined;

  const numCols = headerRow?.children.length || 0;
  const numRows = (bodyRows?.length || 0) + 1; // +1 for header

  // Initialize column widths if not set (using 'auto' for natural sizing)
  React.useEffect(() => {
    if (columnWidths.length === 0 && numCols > 0) {
      // Start with auto-sizing (0 means auto)
      setColumnWidths(Array(numCols).fill(0));
    }
  }, [numCols, columnWidths.length]);

  // Handle resize start
  const handleResizeStart = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Get actual width from DOM if it's auto-sized (0)
    const actualWidth =
      columnWidths[colIndex] ||
      tableRef.current
        ?.querySelector(`th:nth-child(${colIndex + 1})`)
        ?.getBoundingClientRect().width ||
      150;

    setResizingCol(colIndex);
    setStartX(e.clientX);
    setStartWidth(actualWidth);
  };

  // Handle resize move
  React.useEffect(() => {
    if (resizingCol === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff); // Minimum width 80px

      setColumnWidths((prev) => {
        const newWidths = [...prev];
        newWidths[resizingCol] = newWidth;
        return newWidths;
      });
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingCol, startX, startWidth]);

  // Column drag handlers
  const handleColumnDragStart = (colIndex: number, e: React.DragEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setDraggingCol(colIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragOver = (colIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingCol === null || draggingCol === colIndex) return;
    setDragOverCol(colIndex);
  };

  const handleColumnDrop = (targetColIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingCol === null || draggingCol === targetColIndex || !headerRow || !bodyRows) return;

    // Swap columns in header
    const newHeaderChildren = [...headerRow.children];
    const [draggedHeader] = newHeaderChildren.splice(draggingCol, 1);
    newHeaderChildren.splice(targetColIndex, 0, draggedHeader);

    const newHeaderRow: StructuralNode = {
      ...headerRow,
      children: newHeaderChildren,
    };

    // Swap columns in all body rows
    const newBodyRows = bodyRows.map((row) => {
      const newRowChildren = [...row.children];
      const [draggedCell] = newRowChildren.splice(draggingCol, 1);
      newRowChildren.splice(targetColIndex, 0, draggedCell);
      return {
        ...row,
        children: newRowChildren,
      };
    });

    // Swap column widths
    const newWidths = [...columnWidths];
    const [draggedWidth] = newWidths.splice(draggingCol, 1);
    newWidths.splice(targetColIndex, 0, draggedWidth);
    setColumnWidths(newWidths);

    // Update table
    const newThead: StructuralNode = {
      ...thead!,
      children: [newHeaderRow],
    };

    const newTbody: StructuralNode = {
      ...tbody!,
      children: newBodyRows,
    };

    const newTable: StructuralNode = {
      ...table,
      children: [newThead, newTbody],
    };

    onUpdate(node.id, {
      children: [newTable],
    });

    setDraggingCol(null);
    setDragOverCol(null);
  };

  const handleColumnDragEnd = () => {
    setDraggingCol(null);
    setDragOverCol(null);
  };

  // Row drag handlers
  const handleRowDragStart = (rowIndex: number, e: React.DragEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    setDraggingRow(rowIndex);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleRowDragOver = (rowIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingRow === null || draggingRow === rowIndex) return;
    setDragOverRow(rowIndex);
  };

  const handleRowDrop = (targetRowIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingRow === null || draggingRow === targetRowIndex || !bodyRows) return;

    // Reorder rows
    const newBodyRows = [...bodyRows];
    const [draggedRow] = newBodyRows.splice(draggingRow, 1);
    newBodyRows.splice(targetRowIndex, 0, draggedRow);

    const newTbody: StructuralNode = {
      ...tbody!,
      children: newBodyRows,
    };

    const newTable: StructuralNode = {
      ...table,
      children: [thead!, newTbody],
    };

    onUpdate(node.id, {
      children: [newTable],
    });

    setDraggingRow(null);
    setDragOverRow(null);
  };

  const handleRowDragEnd = () => {
    setDraggingRow(null);
    setDragOverRow(null);
  };

  const addColumn = () => {
    if (!headerRow || !bodyRows || readOnly) return;

    // Add th to header
    const newHeader: StructuralNode = {
      ...headerRow,
      children: [
        ...headerRow.children,
        {
          id: `th-${Date.now()}`,
          type: "th" as const,
          content: `Column ${numCols + 1}`,
          attributes: {},
        } as TextNode,
      ],
    };

    // Add td to each body row
    const newBodyRows = bodyRows.map((row, idx) => ({
      ...row,
      children: [
        ...row.children,
        {
          id: `td-${Date.now()}-${idx}`,
          type: "td" as const,
          content: "",
          attributes: {},
        } as TextNode,
      ],
    }));

    const newThead: StructuralNode = {
      ...thead!,
      children: [newHeader],
    };

    const newTbody: StructuralNode = {
      ...tbody!,
      children: newBodyRows,
    };

    const newTable: StructuralNode = {
      ...table,
      children: [newThead, newTbody],
    };

    onUpdate(node.id, {
      children: [newTable],
    });

    // Add width for new column (default 150px for empty columns)
    setColumnWidths((prev) => [...prev, 150]);
  };

  const addRow = () => {
    if (!bodyRows || !headerRow || readOnly) return;

    const newCells = Array.from({ length: numCols }, (_, idx) => ({
      id: `td-${Date.now()}-${idx}`,
      type: "td" as const,
      content: "",
      attributes: {},
    }));

    const newRow: StructuralNode = {
      id: `tr-${Date.now()}`,
      type: "tr",
      children: newCells,
      attributes: {},
    };

    const newTbody: StructuralNode = {
      ...tbody!,
      children: [...bodyRows, newRow],
    };

    const newTable: StructuralNode = {
      ...table,
      children: [thead!, newTbody],
    };

    onUpdate(node.id, {
      children: [newTable],
    });
  };

  const removeColumn = (colIndex: number) => {
    if (!headerRow || !bodyRows || readOnly || numCols <= 1) return;

    const newHeader: StructuralNode = {
      ...headerRow,
      children: headerRow.children.filter((_, idx) => idx !== colIndex),
    };

    const newBodyRows = bodyRows.map((row) => ({
      ...row,
      children: row.children.filter((_, idx) => idx !== colIndex),
    }));

    const newThead: StructuralNode = {
      ...thead!,
      children: [newHeader],
    };

    const newTbody: StructuralNode = {
      ...tbody!,
      children: newBodyRows,
    };

    const newTable: StructuralNode = {
      ...table,
      children: [newThead, newTbody],
    };

    onUpdate(node.id, {
      children: [newTable],
    });

    // Remove width for deleted column
    setColumnWidths((prev) => prev.filter((_, idx) => idx !== colIndex));
  };

  const removeRow = (rowIndex: number) => {
    if (!bodyRows || readOnly || bodyRows.length <= 1) return;

    const newBodyRows = bodyRows.filter((_, idx) => idx !== rowIndex);

    const newTbody: StructuralNode = {
      ...tbody!,
      children: newBodyRows,
    };

    const newTable: StructuralNode = {
      ...table,
      children: [thead!, newTbody],
    };

    onUpdate(node.id, {
      children: [newTable],
    });
  };

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    content: string,
    isHeader: boolean
  ) => {
    if (readOnly) return;

    if (isHeader && headerRow) {
      const newHeader: StructuralNode = {
        ...headerRow,
        children: headerRow.children.map((cell, idx) =>
          idx === colIndex ? { ...cell, content } : cell
        ),
      };

      const newThead: StructuralNode = {
        ...thead!,
        children: [newHeader],
      };

      const newTable: StructuralNode = {
        ...table,
        children: [newThead, tbody!],
      };

      onUpdate(node.id, {
        children: [newTable],
      });
    } else if (bodyRows) {
      const newBodyRows = bodyRows.map((row, rIdx) => {
        if (rIdx === rowIndex) {
          return {
            ...row,
            children: row.children.map((cell, cIdx) =>
              cIdx === colIndex ? { ...cell, content } : cell
            ),
          };
        }
        return row;
      });

      const newTbody: StructuralNode = {
        ...tbody!,
        children: newBodyRows,
      };

      const newTable: StructuralNode = {
        ...table,
        children: [thead!, newTbody],
      };

      onUpdate(node.id, {
        children: [newTable],
      });
    }
  };

  // Drag handlers for the entire table
  const handleTableDragStart = (e: React.DragEvent) => {
    if (readOnly || !onBlockDragStart) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        nodeId: node.id,
        type: "table",
      })
    );
    onBlockDragStart(node.id);
  };

  const handleTableDragEnd = () => {
    // Cleanup if needed
  };

  return (
    <div
      className="relative group/table"
      style={{
        paddingLeft: readOnly ? "0" : "28px",
        marginLeft: readOnly ? "0" : "-28px",
      }}
      onMouseEnter={() => {
        if (!readOnly) {
          setShowColControls(true);
          setShowRowControls(true);
          setIsHovering(true);
        }
      }}
      onMouseLeave={() => {
        setShowColControls(false);
        setShowRowControls(false);
        setHoveredCol(null);
        setHoveredRow(null);
        setIsHovering(false);
      }}
    >
      {/* Drag Handle for entire table */}
      {!readOnly && isHovering && onBlockDragStart && (
        <div
          draggable
          onDragStart={handleTableDragStart}
          onDragEnd={handleTableDragEnd}
          className="absolute left-1 top-8 cursor-grab active:cursor-grabbing opacity-0 group-hover/table:opacity-100 transition-opacity duration-200 z-20"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical
            className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors duration-200"
            strokeWidth={1.5}
          />
        </div>
      )}

      <div className="relative w-fit mx-auto">
        {/* Column controls - top */}
        {showColControls && (
          <div className="absolute top-0 left-8 right-0 flex justify-center gap-1 z-10">
            {Array.from({ length: numCols }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center"
                style={{ width: `${100 / numCols}%` }}
                onMouseEnter={() => setHoveredCol(idx)}
                onMouseLeave={() => setHoveredCol(null)}
              >
                {hoveredCol === idx && numCols > 1 && (
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="h-5 w-5"
                    onClick={() => removeColumn(idx)}
                    title="Remove column"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              size="icon"
              variant="secondary"
              type="button"
              className="h-6 w-6 ml-1"
              onClick={addColumn}
              title="Add column"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Row controls - left side */}
        {showRowControls && bodyRows && (
          <div className="absolute -left-2 top-0 bottom-0 flex flex-col justify-start gap-1 z-10 pt-10">
            {bodyRows.map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center"
                style={{ height: "40px" }}
                onMouseEnter={() => setHoveredRow(idx)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {hoveredRow === idx && bodyRows.length > 1 && (
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="h-4 w-4"
                    onClick={() => removeRow(idx)}
                    title="Remove row"
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              size="icon"
              variant="secondary"
              className="h-4 w-4 mt-1"
              onClick={addRow}
              type="button"
              title="Add row"
            >
              <Plus className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}

        <div className="relative w-fit mx-auto py-5 overflow-x-auto">
          {/* Table */}
          <table
            ref={tableRef}
            className="border-collapse border border-border"
            style={{ width: "auto" }}
          >
            <thead>
              {headerRow && (
                <tr>
                  {headerRow.children.map((cell, colIdx) => (
                    <th
                      key={cell.id}
                      className={cn(
                        "border border-border bg-muted/50 p-2 font-semibold text-left relative group/cell",
                        hoveredCol === colIdx && "bg-muted",
                        dragOverCol === colIdx && draggingCol !== colIdx && "bg-primary/20"
                      )}
                      style={
                        columnWidths[colIdx]
                          ? {
                            width: columnWidths[colIdx],
                            minWidth: columnWidths[colIdx],
                            maxWidth: columnWidths[colIdx],
                          }
                          : {
                            whiteSpace: "nowrap",
                          }
                      }
                      draggable={!readOnly}
                      onDragStart={(e) => handleColumnDragStart(colIdx, e)}
                      onDragOver={(e) => handleColumnDragOver(colIdx, e)}
                      onDrop={(e) => handleColumnDrop(colIdx, e)}
                      onDragEnd={handleColumnDragEnd}
                    >
                      <div className="flex items-center gap-1">
                        {/* Drag handle for column */}
                        {!readOnly && (
                          <div
                            className="opacity-0 group-hover/cell:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}

                        <input
                          type="text"
                          value={(cell as TextNode).content || ""}
                          onChange={(e) =>
                            handleCellChange(0, colIdx, e.target.value, true)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !(cell as TextNode).content && numCols > 1) {
                              e.preventDefault();
                              removeColumn(colIdx);
                            }
                          }}
                          readOnly={readOnly}
                          className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0"
                          placeholder={`Column ${colIdx + 1}`}
                        />
                      </div>

                      {/* Resize handle */}
                      {!readOnly && (
                        <div
                          className={cn(
                            "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors",
                            resizingCol === colIdx && "bg-primary"
                          )}
                          onMouseDown={(e) => handleResizeStart(colIdx, e)}
                          style={{ userSelect: "none" }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {bodyRows?.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className={cn(
                    "group/row",
                    hoveredRow === rowIdx && "bg-muted/30",
                    dragOverRow === rowIdx && draggingRow !== rowIdx && "bg-primary/20"
                  )}
                  draggable={!readOnly}
                  onDragStart={(e) => handleRowDragStart(rowIdx, e)}
                  onDragOver={(e) => handleRowDragOver(rowIdx, e)}
                  onDrop={(e) => handleRowDrop(rowIdx, e)}
                  onDragEnd={handleRowDragEnd}
                >
                  {row.children.map((cell, colIdx) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "border border-border p-2 relative",
                        hoveredCol === colIdx && "bg-muted/50"
                      )}
                      style={
                        columnWidths[colIdx]
                          ? {
                            width: columnWidths[colIdx],
                            minWidth: columnWidths[colIdx],
                            maxWidth: columnWidths[colIdx],
                          }
                          : {
                            whiteSpace: "nowrap",
                          }
                      }
                    >
                      <div className="flex items-center gap-1">
                        {/* Drag handle for row (only show in first column) */}
                        {!readOnly && colIdx === 0 && (
                          <div
                            className="opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}

                        <input
                          type="text"
                          value={(cell as TextNode).content || ""}
                          onChange={(e) =>
                            handleCellChange(rowIdx, colIdx, e.target.value, false)
                          }
                          readOnly={readOnly}
                          className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0"
                          placeholder="Enter text"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
