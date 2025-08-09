import PropTypes from 'prop-types';

const StorageCard = ({ item, onDelete, onEdit, onUse }) => {
  const getStockStatus = () => {
    // Parse original quantity to calculate percentage
    const originalMatch = item['数量及数量单位'].match(/([0-9.]+)/);
    if (!originalMatch) return { color: 'text-gray-600', bg: 'bg-gray-50', label: '数量未知' };
    
    const originalQuantity = parseFloat(originalMatch[1]);
    const percentage = originalQuantity > 0 ? (item['当前库存量'] / originalQuantity) * 100 : 0;
    
    if (percentage < 10) return { color: 'text-red-600', bg: 'bg-red-50', label: '库存不足' };
    if (percentage < 30) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '库存较低' };
    return { color: 'text-green-600', bg: 'bg-green-50', label: '库存充足' };
  };

  const status = getStockStatus();

  // Calculate stock percentage for progress bar
  const getStockPercentage = () => {
    const originalMatch = item['数量及数量单位'].match(/([0-9.]+)/);
    if (!originalMatch) return 0;
    
    const originalQuantity = parseFloat(originalMatch[1]);
    return originalQuantity > 0 ? Math.max(5, (item['当前库存量'] / originalQuantity) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-lg text-gray-900 mb-1 break-words leading-tight">
            {item['产品名']}
          </h3>
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
            {item['类型']}
          </span>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          {onUse && (
            <button
              onClick={() => onUse(item)}
              className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
              title="使用"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
              title="编辑"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
              title="删除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">原始数量:</span>
          <span className="font-medium">{item['数量及数量单位']}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">当前库存:</span>
          <span className={`font-medium ${status.color}`}>
            {parseFloat(item['当前库存量']).toFixed(2)}{item['单位'] || ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">存放地:</span>
          <span className="font-medium break-words text-right">{item['存放地']}</span>
        </div>
        {item['CAS号'] && (
          <div className="flex justify-between">
            <span className="text-gray-600">CAS号:</span>
            <span className="font-medium font-mono text-xs break-all text-right">{item['CAS号']}</span>
          </div>
        )}
      </div>

      {/* Stock Status Badge */}
      <div className={`mt-3 p-2 rounded text-center text-sm font-medium ${status.bg} ${status.color}`}>
        {status.label}
      </div>

      {/* Stock Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status.color.includes('red') ? 'bg-red-500' :
              status.color.includes('yellow') ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{
              width: `${getStockPercentage()}%`
            }}
          ></div>
        </div>
      </div>

      {/* Last updated */}
      {item['更新时间'] && (
        <div className="mt-3 text-xs text-gray-500">
          更新: {new Date(item['更新时间']).toLocaleDateString('zh-CN')}
        </div>
      )}
    </div>
  );
};

StorageCard.propTypes = {
  item: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onUse: PropTypes.func
};

export default StorageCard; 