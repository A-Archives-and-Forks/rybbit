"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { DateTime } from "luxon";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
} from "lucide-react";
import { UsersResponse, useGetUsers } from "../../../api/analytics/users";
import { Button } from "../../../components/ui/button";
import { CountryFlag } from "../components/shared/icons/CountryFlag";
import { Browser } from "../components/shared/icons/Browser";
import { OperatingSystem } from "../components/shared/icons/OperatingSystem";
import { getCountryName } from "../../../lib/utils";
import { Smartphone, Tablet, Monitor } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { SubHeader } from "../components/SubHeader/SubHeader";
import { USER_PAGE_FILTERS } from "../../../lib/store";
import Avatar from "boring-avatars";

// Set up column helper
const columnHelper = createColumnHelper<UsersResponse>();

// Create a reusable sort header component
const SortHeader = ({ column, children }: any) => {
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(isSorted === "asc")}
      className="p-0 hover:bg-transparent"
    >
      {children}
      {isSorted ? (
        isSorted === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
};

export default function UsersPage() {
  const router = useRouter();
  const { site } = useParams();

  // State for server-side operations
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_seen", desc: true },
  ]);

  // Convert page index to 1-based for the API
  const page = pagination.pageIndex + 1;

  // Get the first sorting column
  const sortBy = sorting.length > 0 ? sorting[0].id : "last_seen";
  const sortOrder = sorting.length > 0 && !sorting[0].desc ? "asc" : "desc";

  // Fetch data
  const { data, isLoading, isError } = useGetUsers({
    page,
    pageSize: pagination.pageSize,
    sortBy,
    sortOrder,
  });

  // Format relative time with special handling for times less than 1 minute
  const formatRelativeTime = (dateStr: string) => {
    const date = DateTime.fromSQL(dateStr, { zone: "utc" }).toLocal();
    const diff = Math.abs(date.diffNow(["minutes"]).minutes);

    if (diff < 1) {
      return "<1 min ago";
    }

    return date.toRelative();
  };

  // Define table columns with consistent Title Case capitalization
  const columns = [
    columnHelper.accessor("user_id", {
      header: "User ID",
      cell: (info) => (
        <div className="] truncate flex items-center gap-2 text-neutral-250">
          <Avatar
            size={20}
            name={info.getValue() as string}
            variant="marble"
            colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
          />
          {info.getValue().slice(0, 6)}
        </div>
      ),
    }),
    columnHelper.accessor("country", {
      header: "Country",
      cell: (info) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <CountryFlag country={info.getValue() || ""} />
          {info.getValue() ? getCountryName(info.getValue()) : "Unknown"}
        </div>
      ),
    }),
    columnHelper.accessor("browser", {
      header: "Browser",
      cell: (info) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Browser browser={info.getValue() || "Unknown"} />
          {info.getValue() || "Unknown"}
        </div>
      ),
    }),
    columnHelper.accessor("operating_system", {
      header: "Operating System",
      cell: (info) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <OperatingSystem os={info.getValue() || ""} />
          {info.getValue() || "Unknown"}
        </div>
      ),
    }),
    columnHelper.accessor("device_type", {
      header: "Device Type",
      cell: (info) => {
        const deviceType = info.getValue();
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            {deviceType === "Desktop" && <Monitor className="w-4 h-4" />}
            {deviceType === "Mobile" && <Smartphone className="w-4 h-4" />}
            {deviceType === "Tablet" && <Tablet className="w-4 h-4" />}
            {deviceType || "Unknown"}
          </div>
        );
      },
    }),
    columnHelper.accessor("pageviews", {
      header: ({ column }) => (
        <SortHeader column={column}>Pageviews</SortHeader>
      ),
      cell: (info) => (
        <div className="whitespace-nowrap">
          {info.getValue().toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor("events", {
      header: ({ column }) => <SortHeader column={column}>Events</SortHeader>,
      cell: (info) => (
        <div className="whitespace-nowrap">
          {info.getValue().toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor("sessions", {
      header: ({ column }) => <SortHeader column={column}>Sessions</SortHeader>,
      cell: (info) => (
        <div className="whitespace-nowrap">
          {info.getValue().toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor("last_seen", {
      header: ({ column }) => (
        <SortHeader column={column}>Last Seen</SortHeader>
      ),
      cell: (info) => {
        const date = DateTime.fromSQL(info.getValue(), {
          zone: "utc",
        }).toLocal();
        const formattedDate = date.toLocaleString(DateTime.DATETIME_SHORT);
        const relativeTime = formatRelativeTime(info.getValue());

        return (
          <div className="whitespace-nowrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{relativeTime}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    }),
    columnHelper.accessor("first_seen", {
      header: ({ column }) => (
        <SortHeader column={column}>First Seen</SortHeader>
      ),
      cell: (info) => {
        const date = DateTime.fromSQL(info.getValue(), {
          zone: "utc",
        }).toLocal();
        const formattedDate = date.toLocaleString(DateTime.DATETIME_SHORT);
        const relativeTime = formatRelativeTime(info.getValue());

        return (
          <div className="whitespace-nowrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{relativeTime}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formattedDate}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    }),
  ];

  // Set up table instance
  const table = useReactTable({
    data: data?.data || [],
    columns,
    pageCount: data?.totalCount
      ? Math.ceil(data.totalCount / pagination.pageSize)
      : -1,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    sortDescFirst: true,
  });

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        An error occurred while fetching users data.
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1400px] mx-auto space-y-3">
      <SubHeader availableFilters={USER_PAGE_FILTERS} />
      <div className="rounded-md border border-neutral-800 bg-neutral-900">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-850 text-neutral-400 ">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-3 py-1 font-medium whitespace-nowrap"
                      style={{
                        minWidth: header.id === "user_id" ? "100px" : "auto",
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 15 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-neutral-800 animate-pulse"
                  >
                    {Array.from({ length: columns.length }).map(
                      (_, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-3">
                          <div className="h-4 bg-neutral-800 rounded"></div>
                        </td>
                      )
                    )}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-8 text-center text-neutral-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const userId = row.original.user_id;
                  const href = `/${site}/user/${userId}`;

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-neutral-800 hover:bg-neutral-800 cursor-pointer group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-3 relative">
                          <Link
                            href={href}
                            className="absolute inset-0 z-10"
                            aria-label={`View user ${userId}`}
                          >
                            <span className="sr-only">View user details</span>
                          </Link>
                          <span className="relative z-0">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
          <div className="text-sm text-neutral-400">
            {isLoading ? (
              <span>Loading users...</span>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold">
                  {data?.data?.length
                    ? table.getState().pagination.pageIndex *
                        pagination.pageSize +
                      1
                    : 0}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {data?.data?.length
                    ? Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          pagination.pageSize,
                        data?.totalCount || 0
                      )
                    : 0}
                </span>{" "}
                of{" "}
                <span className="font-semibold">{data?.totalCount || 0}</span>{" "}
                users
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-neutral-400">
              {isLoading ? (
                <span>Loading...</span>
              ) : (
                <>
                  Page{" "}
                  <span className="font-semibold">
                    {table.getState().pagination.pageIndex + 1}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {Math.max(table.getPageCount(), 1)}
                  </span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage() || isLoading}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
