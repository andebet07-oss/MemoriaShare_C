import React, { useCallback, useMemo } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { Loader2 } from "lucide-react";
import PhotoCard from "./PhotoCard";

// ── Static grid containers — defined OUTSIDE the component so their reference
// never changes between renders. VirtuosoGrid uses reference equality on the
// `components` prop; unstable references force it to remount the entire grid.
const GridContainer = React.forwardRef(({ children, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-1"
  >
    {children}
  </div>
));
GridContainer.displayName = "GridContainer";

const ItemContainer = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export default function PhotoGrid({
  displayedPhotos,
  setSelectedIndex,
  isAdminView,
  confirmDeleteId,
  setConfirmDeleteId,
  deletingId,
  handleAdminDelete,
  handleGuestDeletePhoto,
  handleRequestDeletion,
  currentUser,
  getDisplayUploaderName,
  hasMore,
  isFetchingMore,
  fetchNextPage,
}) {
  // ── Stable components object ─────────────────────────────────────────────
  // Footer needs isFetchingMore, so it cannot be static. useMemo keyed on the
  // two values that can actually change it; List/Item remain the static refs.
  const gridComponents = useMemo(() => ({
    List: GridContainer,
    Item: ItemContainer,
    Footer: () =>
      !isAdminView && isFetchingMore ? (
        <div className="w-full flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : null,
  }), [isAdminView, isFetchingMore]);

  // ── Stable endReached callback ────────────────────────────────────────────
  // An inline arrow here would give VirtuosoGrid a new function ref on every
  // parent render, triggering internal effect re-runs in the virtualiser.
  const handleEndReached = useCallback(() => {
    if (!isAdminView && hasMore && !isFetchingMore && fetchNextPage) {
      fetchNextPage();
    }
  }, [isAdminView, hasMore, isFetchingMore, fetchNextPage]);

  // ── Stable item renderer ─────────────────────────────────────────────────
  const itemContent = useCallback(
    (index) => {
      const photo = displayedPhotos[index];
      if (!photo) return null;
      return (
        <PhotoCard
          photo={photo}
          index={index}
          setSelectedIndex={setSelectedIndex}
          isAdminView={isAdminView}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
          deletingId={deletingId}
          handleAdminDelete={handleAdminDelete}
          handleGuestDeletePhoto={handleGuestDeletePhoto}
          handleRequestDeletion={handleRequestDeletion}
          currentUser={currentUser}
          getDisplayUploaderName={getDisplayUploaderName}
        />
      );
    },
    [
      displayedPhotos,
      setSelectedIndex,
      isAdminView,
      confirmDeleteId,
      setConfirmDeleteId,
      deletingId,
      handleAdminDelete,
      handleGuestDeletePhoto,
      handleRequestDeletion,
      currentUser,
      getDisplayUploaderName,
    ]
  );

  return (
    <VirtuosoGrid
      useWindowScroll
      totalCount={displayedPhotos.length}
      components={gridComponents}
      endReached={handleEndReached}
      itemContent={itemContent}
      // Pre-render 600px above and below the visible viewport so the user
      // almost never sees a blank row when scrolling quickly on mobile.
      increaseViewportBy={600}
    />
  );
}