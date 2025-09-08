import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { storageAPI } from '../../services/api';

const StorageForm = ({ initialData, onSubmit, onCancel }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData || {
      '类型': '',
      '产品名': '',
      '品牌': '',
      '数量及数量单位': '',
      '存放地': '',
      'CAS号': ''
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [storageLocations, setStorageLocations] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  
  // Type autocomplete state
  const [storageTypes, setStorageTypes] = useState([]);
  const [typeSuggestions, setTypeSuggestions] = useState([]);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(-1);
  
  // Brand autocomplete state
  const [storageBrands, setStorageBrands] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(-1);

  // Default type options to combine with database types
  const typeOptions = [
    '化学品'
  ];

  // Default brand options to combine with database brands
  const brandOptions = [
    '22121', '3AChem', '67-68-5', 'abbkine', 'Abcam', 'ABCLONAL', 'ABCONE', 'Acros',
    'Acros Organics', 'Adamas', 'Affinity', 'ALADDIN', 'ALADDIN/阿拉丁', 'Aldrich',
    'Alfa', 'Alfa Aesar', 'ambeed', 'AMMEX', 'AMRESCO', 'APExBIO', 'ATCC细胞库',
    'Avanti', 'BD', 'Beyotime', 'Biobend', 'BIOFROX', 'BioLegend', 'biolenged',
    'Biologix', 'BIORAD', 'biorad伯乐', 'Biosharp', 'biotopped', 'BioXcell',
    'Budget Sensors', 'chembee', 'Collins/柯林斯', 'Corning', 'CRENOV/科润乐',
    'Cytiva', 'Eabscience', 'eBioscience', 'Elabscience', 'EMC', 'EngineeringForLife',
    'Epigentek', 'ews', 'FALCON', 'fluka', 'geneoptimal', 'Gibco', 'Gilleffe',
    'glbbio', 'GlpBio', 'Greagent', 'Hyclone', 'imate', 'ImmunoWay Biotechnology Company',
    'Innochem', 'Invitrogen', 'ji', 'kamoer', 'KIGENE', 'KKL', 'labselect',
    'Life Science', 'l罗恩', 'MACKLIN/麦克林', 'MCE', 'MedChemExpress',
    'MedChemExpress（MCE）', 'Megazyme', 'Merck', 'Mesgen', 'Mili', 'Millipore',
    'MYM', 'NEST', 'Origene', 'PARAFILM', 'POMEX', 'Procell普诺赛', 'proteintech',
    'proteintech, 碧云天', 'Psaitong', 'Royacel', 'SAB', 'Scilogex', 'Sigma',
    'Sigma Aldrich', 'Sigma-Aldrich', 'sinocare', 'Solarbio', 'Solarbio/索莱宝',
    'takara', 'Taopu-biotech', 'TargetMol', 'TCI', 'Thermalfisher', 'Thermo Fisher',
    'Thermo Fisher Scientific', 'thermofisher', 'Umibio宇玫博生物', 'veet/薇婷',
    'VETEC', 'whatman', 'WHB', 'Worthington Biochemical Corporation', 'YareBio',
    'Zcibio', '阿法艾莎', '阿拉丁', '埃尔法', '爱斐', '安佳', '安立信', '安耐吉',
    '安耐吉化学', '白鲨', '百灵威', '百萤生物', '北京北陆药业股份有限公司',
    '北京索莱宝科技有限公司', '贝博', '贝克曼库尔特', '贝易宁', '比克曼生物',
    '毕得医药', '碧云天', '博美实验仪器', '博耀生物', '超研生物', '晨源',
    '大连美伦', '得力', '雕牌', '多莱泌', '多沃', '多沃生物', '帆船', '飞捷',
    '飞利浦', '菲越生物', '丰晖生物', '复旦大学肿瘤医院', '富衡生物', '甘李',
    '光明', '广陆', '广州佳灵生物技术有限公司', '广州市花都区狮岭莱客模具商行',
    '国药', '国药集团', '国药试剂', '海星生物', '海盈康', '海盈康 医疗科技有限公司',
    '杭州联科生物技术股份有限公司', '浩普', '浩天实验耗材', '禾汽',
    '和元生物技术（上海）股份有限公司', '恒奥生物科技有限公司', '洪达',
    '湖南华腾制药有限公司', '沪试', '沪试-特价', '华迈科', '环凯', '环球生物',
    '汇达', '吉尔生化', '吉玛', '吉玛基因', '济南岱罡生物工程有限公司',
    '佳足', '江苏红果科技', '江苏协同医药生物', '教超', '教育超市', '金环医疗',
    '京东', '凯基', '凯基生物', '凯库勒', '凯库勒KKL MED', '康德莱', '康宁',
    '康卫视', '科杰生物', '科美', '科学指南针', '莱宝', '乐研试剂', '雷杜',
    '雷根生物', '仑昌硕', '罗恩', '罗恩试剂', '马尔文', '迈基生物', '迈谨生物',
    '迈瑞尔', '迈维代谢', '麦克林', '美国樱花SAKURA', '美仑', '美仑+普诺赛',
    '美伦生物', '美森细胞', '梦怡美', '默克', '默瑞', '南京建成生物工程研究所有限公司',
    '南京肽业', '诺维赞', '颇尔（PALL）', '普诺赛', '七海生物', '千曦生物科技有限公司',
    '日新', '锐博', '瑞博', '瑞沃德', '瑞雨生物', '萨恩化学技术有限公司',
    '塞维尔谷歌生物', '赛多利斯', '赛默飞', '赛普诺', '赛维尔', '赛维尔生物',
    '山东岱罡生物科技有限公司', '上海阿拉丁生化科技股份有限公司',
    '上海百灵威化学技术有限公司', '上海毕得医药科技股份有限公司', '上海碧云天',
    '上海碧云天生物技术有限公司', '上海超研生物科技有限公司', '上海多沃',
    '上海合信成生物技术有限公司', '上海宏生生物科技有限公司', '上海佳足',
    '上海杰思捷实验动物有限公司', '上海捷妮泰生物科技有限公司',
    '上海金钟手术器械', '上海晶诺生物科技有限公司', '上海迈瑞尔化学技术有限公司',
    '上海麦克林生化科技有限公司', '上海生工', '上海斯莱克实验动物有限公司',
    '上海泰坦股份有限公司', '上海泰坦科技股份有限公司', '上海旭东海普药业有限公司',
    '上海亚亦生物科技有限公司', '上海炎怡生物', '上海研匠生物公司', '上海易升',
    '上海易笙工业科技有限公司', '上海易势化工有限公司', '上海源叶生物科技有限公司',
    '上海中科院细胞库', '上海茁彩生物科技有限公司', '生工', '生工生物',
    '生工生物工程(上海)股份有限公司', '生物生工', '圣克鲁斯生物技术',
    '石家庄康卫仕医疗器械有限公司', '斯莱克', '斯曼峰', '四季青', '索莱宝',
    '泰坦', '泰州诺米', '淘宝', '天津市灏洋生物制品科技有限责任公司', '天能',
    '拓然生物', '沃凯', '武汉普诺赛', '武汉三鹰', '西安齐岳生物科技有限公司',
    '西安瑞希生物科技有限公司', '西安瑞禧生物科技有限公司', '西宝生物科技',
    '希恩思', '湘玻', '欣维尔', '星宇', '雅吉生物', '雅酶', '炎怡', '研匠生物',
    '伊莱瑞特', '伊诺凯', '奕源', '益民医用', '翌圣生物', '宇玫博', '郁康',
    '昱盛', '源叶', '月旭', '泽雅科教旗舰店', '甄选', '中国科学院细胞库',
    '中镜科仪', '中科院细胞库', '中乔新舟'
  ];

  // Fetch storage locations, types, and brands on component mount
  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        // Fetch locations
        const locationsResponse = await storageAPI.getStorageLocations();
        if (locationsResponse.success) {
          setStorageLocations(locationsResponse.locations || []);
        }
        
        // Fetch types
        const typesResponse = await storageAPI.getStorageTypes();
        if (typesResponse.success) {
          setStorageTypes(typesResponse.types || []);
        }
        
        // Fetch brands
        const brandsResponse = await storageAPI.getStorageBrands();
        if (brandsResponse.success) {
          setStorageBrands(brandsResponse.brands || []);
        }
      } catch (error) {
        console.error('Error fetching storage data:', error);
      }
    };
    
    fetchStorageData();
  }, []);

  // Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const locationContainer = event.target.closest('.storage-location-container');
      const typeContainer = event.target.closest('.storage-type-container');
      const brandContainer = event.target.closest('.storage-brand-container');
      
      if (!locationContainer) {
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
      }
      
      if (!typeContainer) {
        setShowTypeSuggestions(false);
        setSelectedTypeIndex(-1);
      }
      
      if (!brandContainer) {
        setShowBrandSuggestions(false);
        setSelectedBrandIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const pattern = /^[0-9.]+\s*[a-zA-Zμ\u4e00-\u9fa5]+$/;
    if (!pattern.test(value)) {
      return '请输入正确格式，如: 100ml, 50g, 200μl, 10瓶, 5盒';
    }
    return true;
  };

  // Handle location input changes
  const handleLocationInput = (value) => {
    if (!value.trim()) {
      // Show all available options when input is empty
      const allOptions = storageLocations
        .filter(location => location && location.toString().trim() !== '');
      setLocationSuggestions(allOptions.slice(0, 8));
      setShowLocationSuggestions(allOptions.length > 0);
      return;
    }

    // Filter suggestions based on input
    const searchTerm = value.toLowerCase().trim();
    const filtered = storageLocations
      .filter(location => location && location.toString().trim() !== '')
      .filter(location => location.toLowerCase().includes(searchTerm))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        // Prioritize matches that start with the search term
        const aStartsWith = aLower.startsWith(searchTerm);
        const bStartsWith = bLower.startsWith(searchTerm);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);

    setLocationSuggestions(filtered);
    setShowLocationSuggestions(filtered.length > 0);
  };

  // Handle type input changes
  const handleTypeInput = (value) => {
    if (!value.trim()) {
      // Show all available options when input is empty
      const allDbTypes = storageTypes.filter(type => type && type.toString().trim() !== '');
      const defaultTypes = typeOptions.filter(type => !allDbTypes.includes(type));
      const combinedOptions = [...allDbTypes, ...defaultTypes];
      setTypeSuggestions(combinedOptions.slice(0, 8));
      setShowTypeSuggestions(combinedOptions.length > 0);
      return;
    }

    // Filter suggestions based on input
    const searchTerm = value.toLowerCase().trim();
    const allDbTypes = storageTypes.filter(type => type && type.toString().trim() !== '');
    const defaultTypes = typeOptions.filter(type => !allDbTypes.includes(type));
    const combinedOptions = [...allDbTypes, ...defaultTypes];
    
    const filtered = combinedOptions
      .filter(type => type.toLowerCase().includes(searchTerm))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        // Prioritize matches that start with the search term
        const aStartsWith = aLower.startsWith(searchTerm);
        const bStartsWith = bLower.startsWith(searchTerm);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);

    setTypeSuggestions(filtered);
    setShowTypeSuggestions(filtered.length > 0);
  };

  // Handle type selection
  const handleTypeSelect = (type) => {
    setValue('类型', type);
    setShowTypeSuggestions(false);
    setSelectedTypeIndex(-1);
  };

  // Handle brand input changes
  const handleBrandInput = (value) => {
    if (!value.trim()) {
      // Show all available options when input is empty
      const allDbBrands = storageBrands.filter(brand => brand && brand.toString().trim() !== '');
      const defaultBrands = brandOptions.filter(brand => !allDbBrands.includes(brand));
      const combinedOptions = [...allDbBrands, ...defaultBrands];
      setBrandSuggestions(combinedOptions.slice(0, 8));
      setShowBrandSuggestions(combinedOptions.length > 0);
      return;
    }

    // Filter suggestions based on input
    const searchTerm = value.toLowerCase().trim();
    const allDbBrands = storageBrands.filter(brand => brand && brand.toString().trim() !== '');
    const defaultBrands = brandOptions.filter(brand => !allDbBrands.includes(brand));
    const combinedOptions = [...allDbBrands, ...defaultBrands];
    
    const filtered = combinedOptions
      .filter(brand => brand.toLowerCase().includes(searchTerm))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        // Prioritize matches that start with the search term
        const aStartsWith = aLower.startsWith(searchTerm);
        const bStartsWith = bLower.startsWith(searchTerm);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);

    setBrandSuggestions(filtered);
    setShowBrandSuggestions(filtered.length > 0);
  };

  // Handle brand selection
  const handleBrandSelect = (brand) => {
    setValue('品牌', brand);
    setShowBrandSuggestions(false);
    setSelectedBrandIndex(-1);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setValue('存放地', location);
    setShowLocationSuggestions(false);
    setSelectedLocationIndex(-1);
  };

  // Handle keyboard navigation for types
  const handleTypeKeyDown = (e) => {
    if (!showTypeSuggestions || typeSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedTypeIndex(prev => 
          prev < typeSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedTypeIndex(prev => 
          prev > 0 ? prev - 1 : typeSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedTypeIndex >= 0) {
          handleTypeSelect(typeSuggestions[selectedTypeIndex]);
        }
        break;
      case 'Escape':
        setShowTypeSuggestions(false);
        setSelectedTypeIndex(-1);
        break;
    }
  };

  // Handle keyboard navigation for brands
  const handleBrandKeyDown = (e) => {
    if (!showBrandSuggestions || brandSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedBrandIndex(prev => 
          prev < brandSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedBrandIndex(prev => 
          prev > 0 ? prev - 1 : brandSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedBrandIndex >= 0) {
          handleBrandSelect(brandSuggestions[selectedBrandIndex]);
        }
        break;
      case 'Escape':
        setShowBrandSuggestions(false);
        setSelectedBrandIndex(-1);
        break;
    }
  };

  // Handle keyboard navigation for locations
  const handleLocationKeyDown = (e) => {
    if (!showLocationSuggestions || locationSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedLocationIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedLocationIndex(prev => 
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedLocationIndex >= 0) {
          handleLocationSelect(locationSuggestions[selectedLocationIndex]);
        }
        break;
      case 'Escape':
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6">
        {initialData ? '编辑库存项目' : '添加库存项目'}
      </h3>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 类型 */}
          <div className="relative storage-type-container">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型 *
            </label>
            <div className="relative">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              
              {/* Type input */}
              <input
                {...register('类型', { 
                  required: '请输入类型',
                  onChange: (e) => handleTypeInput(e.target.value)
                })}
                onKeyDown={handleTypeKeyDown}
                onFocus={(e) => {
                  // Show all available options when input gets focus
                  if (!e.target.value.trim()) {
                    const allDbTypes = storageTypes.filter(type => type && type.toString().trim() !== '');
                    const defaultTypes = typeOptions.filter(type => !allDbTypes.includes(type));
                    const combinedOptions = [...allDbTypes, ...defaultTypes];
                    setTypeSuggestions(combinedOptions.slice(0, 8));
                    setShowTypeSuggestions(combinedOptions.length > 0);
                  }
                }}
                onClick={(e) => {
                  // Show suggestions when clicking the input
                  if (!e.target.value.trim()) {
                    const allDbTypes = storageTypes.filter(type => type && type.toString().trim() !== '');
                    const defaultTypes = typeOptions.filter(type => !allDbTypes.includes(type));
                    const combinedOptions = [...allDbTypes, ...defaultTypes];
                    setTypeSuggestions(combinedOptions.slice(0, 8));
                    setShowTypeSuggestions(combinedOptions.length > 0);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="搜索或输入类型..."
                autoComplete="off"
              />
              
              {/* Clear button when there's input */}
              {watch('类型') && (
                <button
                  type="button"
                  onClick={() => {
                    setValue('类型', '');
                    setTypeSuggestions([]);
                    setShowTypeSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Type suggestions dropdown */}
            {showTypeSuggestions && typeSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {/* Search results header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  找到 {typeSuggestions.length} 个相关类型
                </div>
                
                {/* Results list */}
                <div className="max-h-48 overflow-y-auto">
                  {typeSuggestions.map((type, index) => (
                    <div
                      key={index}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center ${
                        index === selectedTypeIndex 
                          ? 'bg-blue-100 border-blue-200' 
                          : 'hover:bg-blue-50'
                      }`}
                      onClick={() => handleTypeSelect(type)}
                      onMouseEnter={() => setSelectedTypeIndex(index)}
                    >
                      <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-gray-900">{type}</span>
                      {index === selectedTypeIndex && (
                        <span className="ml-auto text-blue-600 text-sm">按 Enter 选择</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {errors['类型'] && (
              <p className="text-red-500 text-sm mt-1">{errors['类型'].message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              输入关键词搜索已使用过的类型，或直接输入新的类型
            </p>
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
          {/* 品牌 */}
          <div className="relative storage-brand-container">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              品牌 (可选)
            </label>
            <div className="relative">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.414A1 1 0 0119.414 16L17 18.414a1 1 0 01-1.414 0L13.586 16a1 1 0 01-.293-.707V9a2 2 0 012-2z" />
                </svg>
              </div>
              
              {/* Brand input */}
              <input
                {...register('品牌', {
                  minLength: { value: 2, message: '品牌至少2个字符' },
                  onChange: (e) => handleBrandInput(e.target.value)
                })}
                onKeyDown={handleBrandKeyDown}
                onFocus={(e) => {
                  // Show all available options when input gets focus
                  if (!e.target.value.trim()) {
                    const allDbBrands = storageBrands.filter(brand => brand && brand.toString().trim() !== '');
                    const defaultBrands = brandOptions.filter(brand => !allDbBrands.includes(brand));
                    const combinedOptions = [...allDbBrands, ...defaultBrands];
                    setBrandSuggestions(combinedOptions.slice(0, 8));
                    setShowBrandSuggestions(combinedOptions.length > 0);
                  }
                }}
                onClick={(e) => {
                  // Show suggestions when clicking the input
                  if (!e.target.value.trim()) {
                    const allDbBrands = storageBrands.filter(brand => brand && brand.toString().trim() !== '');
                    const defaultBrands = brandOptions.filter(brand => !allDbBrands.includes(brand));
                    const combinedOptions = [...allDbBrands, ...defaultBrands];
                    setBrandSuggestions(combinedOptions.slice(0, 8));
                    setShowBrandSuggestions(combinedOptions.length > 0);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="搜索或输入品牌..."
                autoComplete="off"
              />
              
              {/* Clear button when there's input */}
              {watch('品牌') && (
                <button
                  type="button"
                  onClick={() => {
                    setValue('品牌', '');
                    setBrandSuggestions([]);
                    setShowBrandSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Brand suggestions dropdown */}
            {showBrandSuggestions && brandSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {/* Search results header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  找到 {brandSuggestions.length} 个相关品牌
                </div>
                
                {/* Results list */}
                <div className="max-h-48 overflow-y-auto">
                  {brandSuggestions.map((brand, index) => (
                    <div
                      key={index}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center ${
                        index === selectedBrandIndex 
                          ? 'bg-blue-100 border-blue-200' 
                          : 'hover:bg-blue-50'
                      }`}
                      onClick={() => handleBrandSelect(brand)}
                      onMouseEnter={() => setSelectedBrandIndex(index)}
                    >
                      <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.414A1 1 0 0019.414 16L17 18.414a1 1 0 01-1.414 0L13.586 16a1 1 0 01-.293-.707V9a2 2 0 012-2z" />
                      </svg>
                      <span className="text-gray-900">{brand}</span>
                      {index === selectedBrandIndex && (
                        <span className="ml-auto text-blue-600 text-sm">按 Enter 选择</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {errors['品牌'] && (
              <p className="text-red-500 text-sm mt-1">{errors['品牌'].message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              输入关键词搜索已使用过的品牌，或直接输入新的品牌
            </p>
          </div>

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
              支持单位: g, kg, mg, ml, l, μl, ul, 瓶, 盒, OD, 包, 袋, 个, 管, 台, 桶, 箱, 支, 只, mg/ml, μg/ml, μg/l, ng/ml, pg/ml
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 存放地 */}
          <div className="relative storage-location-container">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              存放地 *
            </label>
            <div className="relative">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Search input */}
              <input
                {...register('存放地', { 
                  required: '请输入存放地',
                  onChange: (e) => handleLocationInput(e.target.value)
                })}
                onKeyDown={handleLocationKeyDown}
                onFocus={(e) => {
                  // Show all available options when input gets focus
                  if (!e.target.value.trim()) {
                    const allOptions = storageLocations
                      .filter(location => location && location.toString().trim() !== '');
                    setLocationSuggestions(allOptions.slice(0, 8));
                    setShowLocationSuggestions(allOptions.length > 0);
                  }
                }}
                onClick={(e) => {
                  // Show suggestions when clicking the input
                  if (!e.target.value.trim()) {
                    const allOptions = storageLocations
                      .filter(location => location && location.toString().trim() !== '');
                    setLocationSuggestions(allOptions.slice(0, 8));
                    setShowLocationSuggestions(allOptions.length > 0);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                placeholder="搜索或输入存放地..."
                autoComplete="off"
              />
              
              {/* Clear button when there's input */}
              {watch('存放地') && (
                <button
                  type="button"
                  onClick={() => {
                    setValue('存放地', '');
                    setLocationSuggestions([]);
                    setShowLocationSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Location suggestions dropdown */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {/* Search results header */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  找到 {locationSuggestions.length} 个相关存放地
                </div>
                
                {/* Results list */}
                <div className="max-h-48 overflow-y-auto">
                  {locationSuggestions.map((location, index) => (
                    <div
                      key={index}
                      className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center ${
                        index === selectedLocationIndex 
                          ? 'bg-blue-100 border-blue-200' 
                          : 'hover:bg-blue-50'
                      }`}
                      onClick={() => handleLocationSelect(location)}
                      onMouseEnter={() => setSelectedLocationIndex(index)}
                    >
                      <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-900">{location}</span>
                      {index === selectedLocationIndex && (
                        <span className="ml-auto text-blue-600 text-sm">按 Enter 选择</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {errors['存放地'] && (
              <p className="text-red-500 text-sm mt-1">{errors['存放地'].message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              输入关键词搜索已添加过的存放地，或直接输入新的存放地
            </p>
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
        </div>



        {/* 预览信息 */}
        {watch('产品名') && watch('数量及数量单位') && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">预览</h4>
            <div className="text-blue-700 text-sm space-y-1">
              <div><strong>产品:</strong> {watch('产品名')}</div>
              <div><strong>类型:</strong> {watch('类型')}</div>
              {watch('品牌') && <div><strong>品牌:</strong> {watch('品牌')}</div>}
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