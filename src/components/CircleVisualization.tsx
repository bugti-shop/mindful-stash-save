interface CircleVisualizationProps {
  progress: number;
  jarId: number;
  isLarge?: boolean;
  customImage?: string;
}

const CircleVisualization = ({ progress, jarId, isLarge = false, customImage }: CircleVisualizationProps) => {
  const size = isLarge ? 280 : 140;
  const strokeWidth = isLarge ? 16 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const redProgress = Math.min(progress, 25);
  const orangeProgress = Math.min(Math.max(progress - 25, 0), 25);
  const blueProgress = Math.min(Math.max(progress - 50, 0), 25);
  const greenProgress = Math.min(Math.max(progress - 75, 0), 25);
  
  const redOffset = circumference - (redProgress / 25) * circumference;
  const orangeOffset = circumference - (orangeProgress / 25) * circumference;
  const blueOffset = circumference - (blueProgress / 25) * circumference;
  const greenOffset = circumference - (greenProgress / 25) * circumference;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`red-${jarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`orange-${jarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`blue-${jarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`green-${jarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(200, 200, 200, 0.3)"
          strokeWidth={strokeWidth}
        />
        
        {/* Red segment (0-25%) */}
        {redProgress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#red-${jarId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={redOffset}
            strokeLinecap="round"
          />
        )}
        
        {/* Orange segment (25-50%) */}
        {orangeProgress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#orange-${jarId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={orangeOffset}
            strokeLinecap="round"
            style={{
              transform: `rotate(${(redProgress / 25) * 90}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        )}
        
        {/* Blue segment (50-75%) */}
        {blueProgress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#blue-${jarId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={blueOffset}
            strokeLinecap="round"
            style={{
              transform: `rotate(${((redProgress + orangeProgress) / 25) * 90}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        )}
        
        {/* Green segment (75-100%) */}
        {greenProgress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#green-${jarId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={greenOffset}
            strokeLinecap="round"
            style={{
              transform: `rotate(${((redProgress + orangeProgress + blueProgress) / 25) * 90}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        )}
      </svg>
      
      {/* Center image */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          width: size,
          height: size,
        }}
      >
        <div
          className="rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"
          style={{
            width: radius * 1.6,
            height: radius * 1.6,
          }}
        >
          {customImage ? (
            <img
              src={customImage}
              alt="Custom jar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-center px-2">
              <span className={isLarge ? 'text-sm' : 'text-xs'}>No Image</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleVisualization;
