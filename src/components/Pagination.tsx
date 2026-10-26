import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemName = "registros",
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();
  const startItem =
    totalItems !== undefined && itemsPerPage !== undefined
      ? totalItems === 0
        ? 0
        : (currentPage - 1) * itemsPerPage + 1
      : null;
  const endItem =
    totalItems !== undefined && itemsPerPage !== undefined
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-2 border-t border-gray-200 mt-3 w-full bg-white rounded-b-lg">
      {totalItems !== undefined && (
        <div className="text-xs sm:text-sm text-gray-700 font-medium">
          Mostrando {startItem} al {endItem} de un total de {totalItems} {itemName}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap justify-center ml-auto">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={
            currentPage <= 1
              ? { backgroundColor: "#f3f4f6", color: "#9ca3af", borderColor: "#e5e7eb" }
              : { backgroundColor: "#ffffff", color: "#2563eb", borderColor: "#bfdbfe" }
          }
          title="Página Anterior"
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>

        {/* Números de página */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-gray-400 font-bold text-xs select-none"
              >
                ...
              </span>
            );
          }
          const pageNum = Number(p);
          const isActive = pageNum === currentPage;
          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className="min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-bold transition cursor-pointer"
              style={
                isActive
                  ? {
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: "1px solid #2563eb",
                      boxShadow: "0 2px 4px rgba(37,99,235,0.3)",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                    }
              }
            >
              {pageNum}
            </button>
          );
        })}

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={
            currentPage >= totalPages
              ? { backgroundColor: "#f3f4f6", color: "#9ca3af", borderColor: "#e5e7eb" }
              : { backgroundColor: "#ffffff", color: "#2563eb", borderColor: "#bfdbfe" }
          }
          title="Página Siguiente"
        >
          <span>Siguiente</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
