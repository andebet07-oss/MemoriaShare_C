import React, { useCallback } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { Loader2 } from "lucide-react";
import PhotoCard from "./PhotoCard";

const GridContainer = React.forwardRef(({ children, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-1"
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
    <>
      <VirtuosoGrid
        useWindowScroll
        totalCount={displayedPhotos.length}
        components={{
          List: GridContainer,
          Item: ItemContainer,
          Footer: () =>
            !isAdminView && isFetchingMore ? (
              <div className="w-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : null,
        }}
        endReached={() => {
          if (!isAdminView && hasMore && !isFetchingMore && fetchNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={itemContent}
      />
    </>
  );
}