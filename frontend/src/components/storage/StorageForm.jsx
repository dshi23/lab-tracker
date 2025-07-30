import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';

const StorageForm = ({ initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      '类型': '',
      '产品名': '',
      '数量及数量单位': '',
      '存放地': '',
      'CAS号': ''
    }
  });

  const [submitting, setSubmitting] = useState(false);

  // Common options for dropdowns
  const typeOptions = [
    '化学品',
    '试剂',
    '酶',
    '缓冲液',
    '培养基',
    '其他'
  ];

  const locationOptions = [
    '4°C冰箱A',
    '4°C冰箱B',
    '-20°C冰箱',
    '-80°C冰箱',
    '室温试剂柜',
    '有机试剂柜',
    '无机试剂柜',
    '毒品柜',
    '易燃品柜',
    '其他'
  ];

  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const validateQuantity = (value) => {
    const pattern = /^[0-9.]+\s*[a-zA-Zμ]+$/;
    if (!pattern.test(value)) {
      return '请输入正确格式，如: 100ml, 50g, 200μl';
    }
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">
        {initialData ? '编辑库存项目' : '添加库存项目'}
      </h3>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型 *
            </label>
            <select
              {...register('类型', { required: '请选择类型' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择类型</option>
              {typeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors['类型'] && (
              <p className="text-red-500 text-sm mt-1">{errors['类型'].message}</p>
            )}
          </div>

          {/* 产品名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品名 *
            </label>
            <input
              {...register('产品名', { 
                required: '请输入产品名',
                minLength: { value: 2, message: '产品名至少2个字符' }
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入产品名称"
            />
            {errors['产品名'] && (
              <p className="text-red-500 text-sm mt-1">{errors['产品名'].message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 数量及数量单位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              数量及数量单位 *
            </label>
            <input
              {...register('数量及数量单位', { 
                required: '请输入数量及单位',
                validate: validateQuantity
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="如: 100ml, 50g, 200μl"
            />
            {errors['数量及数量单位'] && (
              <p className="text-red-500 text-sm mt-1">{errors['数量及数量单位'].message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              支持单位: g, kg, mg, ml, l, μl, ul
            </p>
          </div>

          {/* 存放地 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              存放地 *
            </label>
            <select
              {...register('存放地', { required: '请选择存放地' })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择存放地</option>
              {locationOptions.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            {errors['存放地'] && (
              <p className="text-red-500 text-sm mt-1">{errors['存放地'].message}</p>
            )}
          </div>
        </div>

        {/* CAS号 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CAS号 (可选)
          </label>
          <input
            {...register('CAS号', {
              pattern: {
                value: /^[0-9-]+$/,
                message: 'CAS号格式不正确，只能包含数字和连字符'
              }
            })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="如: 123-45-6"
          />
          {errors['CAS号'] && (
            <p className="text-red-500 text-sm mt-1">{errors['CAS号'].message}</p>
          )}
        </div>

        {/* 预览信息 */}
        {watch('产品名') && watch('数量及数量单位') && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">预览</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <div><strong>产品:</strong> {watch('产品名')}</div>
              <div><strong>类型:</strong> {watch('类型')}</div>
              <div><strong>数量:</strong> {watch('数量及数量单位')}</div>
              <div><strong>存放地:</strong> {watch('存放地')}</div>
              {watch('CAS号') && <div><strong>CAS号:</strong> {watch('CAS号')}</div>}
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '保存中...' : (initialData ? '更新库存' : '添加库存')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

StorageForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default StorageForm; 