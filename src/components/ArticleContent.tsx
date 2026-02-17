'use client';

import { useEffect, useRef } from 'react';

interface ArticleContentProps {
  htmlContent: string;
}

/**
 * Detect if a table is a ranking table (first column is numeric rank)
 */
function isRankingTable(table: HTMLTableElement): boolean {
  const rows = table.querySelectorAll('tbody tr');
  if (rows.length === 0) return false;

  let numericCount = 0;
  rows.forEach((row) => {
    const firstCell = row.querySelector('td:first-child');
    if (firstCell) {
      const text = firstCell.textContent?.trim() || '';
      // Check if first cell is a number (possibly with suffix like "位")
      if (/^\d+/.test(text)) {
        numericCount++;
      }
    }
  });

  // If more than half of rows have numeric first cell, it's a ranking table
  return numericCount > rows.length / 2;
}

export default function ArticleContent({ htmlContent }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Find all tables and add data-label attributes for mobile card layout
    const tables = contentRef.current.querySelectorAll('table');
    
    tables.forEach((table) => {
      // Get header labels
      const headers = table.querySelectorAll('thead th');
      const labels: string[] = [];
      headers.forEach((th) => {
        labels.push(th.textContent?.trim() || '');
      });

      // Detect table type and add appropriate class
      if (isRankingTable(table)) {
        table.classList.add('table-ranking');
      } else {
        table.classList.add('table-generic');
      }

      // Add data-label to each td
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((td, index) => {
          if (labels[index]) {
            td.setAttribute('data-label', labels[index]);
          }
        });
      });
    });
  }, [htmlContent]);

  return (
    <div
      ref={contentRef}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
