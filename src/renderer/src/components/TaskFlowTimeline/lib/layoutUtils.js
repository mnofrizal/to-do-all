// Helper function to calculate dynamic subflow dimensions and attachment positions
export const calculateSubflowLayout = (attachmentCount) => {
  // For 2 rows max, calculate how many items per row
  const itemsPerRow = Math.ceil(attachmentCount / 2);
  const rows = attachmentCount > itemsPerRow ? 2 : 1;
  
  // Width: padding + (items per row * item width + spacing between items)
  const itemWidth = 130;
  const itemSpacing = 15;
  const paddingX = 25;
  const dynamicWidth = Math.max(350, paddingX * 2 + (itemsPerRow * itemWidth) + ((itemsPerRow - 1) * itemSpacing));
  
  // Height: padding + (rows * item height + spacing between rows)
  const itemHeight = 75;
  const rowSpacing = 15;
  const paddingY = 30;
  const dynamicHeight = Math.max(180, paddingY * 2 + (rows * itemHeight) + ((rows - 1) * rowSpacing));
  
  return {
    width: dynamicWidth,
    height: dynamicHeight,
    itemsPerRow,
    rows,
    itemWidth,
    itemHeight,
    itemSpacing,
    rowSpacing,
    paddingX,
    paddingY
  };
};

// Helper function to get attachment position within subflow
export const getAttachmentPositionInSubflow = (index, attachmentCount) => {
  const { itemsPerRow, itemWidth, itemHeight, itemSpacing, rowSpacing, paddingX, paddingY } = calculateSubflowLayout(attachmentCount);
  
  // Calculate row and column for this index
  const rowIndex = Math.floor(index / itemsPerRow);
  const colIndex = index % itemsPerRow;
  
  const titleHeight = 32; // Account for title space (same as in calculateSubflowLayout)
  
  return {
    x: paddingX + (colIndex * (itemWidth + itemSpacing)),
    y: paddingY + titleHeight + (rowIndex * (itemHeight + rowSpacing))
  };
};