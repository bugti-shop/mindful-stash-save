import { useMemo } from 'react';
import { TrendingUp, Calendar, Flame, Target, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, subMonths, isWithinInterval, getDay } from 'date-fns';

interface Jar {
  id: number;
  name: string;
  target: number;
  saved: number;
  streak: number;
  withdrawn: number;
  currency?: string;
  records?: TransactionRecord[];
  createdAt?: string;
}

interface TransactionRecord {
  id: number;
  type: 'saved' | 'withdrawn';
  amount: number;
  date: Date;
}

interface AdvancedAnalyticsProps {
  jars: Jar[];
  darkMode: boolean;
}

export const AdvancedAnalytics = ({ jars, darkMode }: AdvancedAnalyticsProps) => {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-800';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const chartColors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    const last30Days = eachDayOfInterval({ start: subMonths(now, 1), end: now });

    // Collect all transactions
    const allTransactions = jars.flatMap(jar => 
      (jar.records || []).map(record => ({
        ...record,
        date: new Date(record.date),
        jarName: jar.name
      }))
    ).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate current month savings
    const currentMonthSavings = allTransactions
      .filter(t => t.type === 'saved' && isWithinInterval(t.date, currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate last month savings
    const lastMonthSavings = allTransactions
      .filter(t => t.type === 'saved' && isWithinInterval(t.date, lastMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    // Savings velocity
    const velocityPercent = lastMonthSavings > 0 
      ? ((currentMonthSavings - lastMonthSavings) / lastMonthSavings) * 100 
      : currentMonthSavings > 0 ? 100 : 0;

    // Predictive analytics for each jar
    const predictions = jars.map(jar => {
      const jarTransactions = (jar.records || [])
        .filter(r => r.type === 'saved')
        .map(r => ({ ...r, date: new Date(r.date) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (jarTransactions.length < 2) {
        return { jarName: jar.name, prediction: null, daysToGoal: null };
      }

      const recentTransactions = jarTransactions.slice(-10);
      const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
      const firstDate = recentTransactions[0].date;
      const lastDate = recentTransactions[recentTransactions.length - 1].date;
      const daysBetween = differenceInDays(lastDate, firstDate) || 1;
      const avgPerDay = (recentTransactions.reduce((sum, t) => sum + t.amount, 0)) / daysBetween;

      const remaining = jar.target - jar.saved;
      const daysToGoal = remaining > 0 && avgPerDay > 0 ? Math.ceil(remaining / avgPerDay) : null;
      const predictedDate = daysToGoal ? new Date(now.getTime() + daysToGoal * 24 * 60 * 60 * 1000) : null;

      return {
        jarName: jar.name,
        prediction: predictedDate,
        daysToGoal,
        avgPerDay
      };
    }).filter(p => p.prediction !== null);

    // Savings by day of week
    const dayOfWeekStats = Array(7).fill(0).map((_, i) => ({
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      amount: 0,
      count: 0
    }));

    allTransactions
      .filter(t => t.type === 'saved')
      .forEach(t => {
        const dayIndex = getDay(t.date);
        dayOfWeekStats[dayIndex].amount += t.amount;
        dayOfWeekStats[dayIndex].count += 1;
      });

    const bestSavingDay = dayOfWeekStats.reduce((best, current) => 
      current.amount > best.amount ? current : best
    );

    const worstSavingDay = dayOfWeekStats.reduce((worst, current) => 
      current.amount < worst.amount && current.count > 0 ? current : worst
    );

    // Weekend vs Weekday comparison
    const weekendSavings = allTransactions
      .filter(t => t.type === 'saved' && (getDay(t.date) === 0 || getDay(t.date) === 6))
      .reduce((sum, t) => sum + t.amount, 0);

    const weekdaySavings = allTransactions
      .filter(t => t.type === 'saved' && getDay(t.date) > 0 && getDay(t.date) < 6)
      .reduce((sum, t) => sum + t.amount, 0);

    // Savings streak calculation
    const savingDates = allTransactions
      .filter(t => t.type === 'saved')
      .map(t => format(t.date, 'yyyy-MM-dd'));

    const uniqueDates = [...new Set(savingDates)].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 0;

    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const date = new Date(uniqueDates[i]);
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() - streakCount);
      
      if (format(date, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        streakCount++;
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diff = differenceInDays(currDate, prevDate);
      
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Daily savings over last 30 days
    const dailySavingsData = last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTotal = allTransactions
        .filter(t => t.type === 'saved' && format(t.date, 'yyyy-MM-dd') === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        date: format(day, 'MMM dd'),
        amount: dayTotal
      };
    });

    // Jar distribution for pie chart
    const jarDistribution = jars.map(jar => ({
      name: jar.name.length > 15 ? jar.name.substring(0, 15) + '...' : jar.name,
      value: jar.saved,
      color: chartColors[jars.indexOf(jar) % chartColors.length]
    }));

    // Weekly comparison for last 4 weeks
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = subMonths(now, 0);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekSavings = allTransactions
        .filter(t => t.type === 'saved' && isWithinInterval(t.date, { start: weekStart, end: weekEnd }))
        .reduce((sum, t) => sum + t.amount, 0);

      weeklyData.push({
        week: `Week ${4 - i}`,
        amount: weekSavings
      });
    }

    return {
      velocityPercent,
      currentMonthSavings,
      lastMonthSavings,
      predictions,
      dayOfWeekStats,
      bestSavingDay,
      worstSavingDay,
      weekendSavings,
      weekdaySavings,
      currentStreak,
      longestStreak,
      dailySavingsData,
      jarDistribution,
      weeklyData,
      totalSaved: jars.reduce((sum, jar) => sum + jar.saved, 0)
    };
  }, [jars]);

  const currency = jars.length > 0 ? jars[0].currency || '$' : '$';

  if (jars.length === 0) {
    return (
      <div className={`${cardBg} rounded-3xl p-6 shadow-lg`}>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className={`${textColor}`} size={32} />
          <h2 className={`text-2xl font-bold ${textColor}`}>Advanced Analytics</h2>
        </div>
        <p className={textSecondary}>Create some jars and start saving to see your analytics!</p>
      </div>
    );
  }

  return (
    <div className={`${cardBg} rounded-3xl p-6 shadow-lg space-y-6`}>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className={`${textColor}`} size={32} />
        <h2 className={`text-2xl font-bold ${textColor}`}>Advanced Analytics</h2>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Savings Velocity */}
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-50 to-blue-50'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-purple-500" size={20} />
            <h3 className={`font-semibold ${textColor}`}>Savings Velocity</h3>
          </div>
          <p className={`text-3xl font-bold ${analytics.velocityPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics.velocityPercent >= 0 ? '+' : ''}{analytics.velocityPercent.toFixed(1)}%
          </p>
          <p className={`text-sm ${textSecondary} mt-1`}>
            {analytics.velocityPercent > 0 
              ? `You're saving ${Math.abs(analytics.velocityPercent).toFixed(0)}% faster than last month! 🚀`
              : analytics.velocityPercent < 0
              ? `Saving ${Math.abs(analytics.velocityPercent).toFixed(0)}% slower than last month`
              : 'Same pace as last month'}
          </p>
        </div>

        {/* Current Streak */}
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-orange-50 to-red-50'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-orange-500" size={20} />
            <h3 className={`font-semibold ${textColor}`}>Savings Streak</h3>
          </div>
          <p className={`text-3xl font-bold text-orange-600`}>
            {analytics.currentStreak} days 🔥
          </p>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Longest streak: {analytics.longestStreak} days
          </p>
        </div>

        {/* Best Saving Day */}
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-green-50 to-emerald-50'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-green-500" size={20} />
            <h3 className={`font-semibold ${textColor}`}>Best Saving Day</h3>
          </div>
          <p className={`text-2xl font-bold text-green-600`}>
            {analytics.bestSavingDay.day}
          </p>
          <p className={`text-sm ${textSecondary} mt-1`}>
            {currency}{formatCurrency(analytics.bestSavingDay.amount)} total saved
          </p>
        </div>
      </div>

      {/* Predictive Analytics */}
      {analytics.predictions.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-cyan-50'} rounded-2xl p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-blue-500" size={20} />
            <h3 className={`font-semibold ${textColor}`}>Goal Predictions</h3>
          </div>
          <div className="space-y-2">
            {analytics.predictions.map((pred, idx) => (
              <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3`}>
                <p className={`font-semibold ${textColor}`}>{pred.jarName}</p>
                <p className={`text-sm ${textSecondary}`}>
                  At this rate, you'll reach your goal on{' '}
                  <span className="font-bold text-blue-600">
                    {pred.prediction ? format(pred.prediction, 'MMMM dd, yyyy') : 'calculating...'}
                  </span>
                  {pred.daysToGoal && ` (${pred.daysToGoal} days)`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekend vs Weekday */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-pink-50 to-purple-50'} rounded-2xl p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-pink-500" size={20} />
          <h3 className={`font-semibold ${textColor}`}>Comparison Metrics</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 text-center`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Weekends</p>
            <p className={`text-2xl font-bold text-purple-600`}>{currency}{formatCurrency(analytics.weekendSavings)}</p>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 text-center`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Weekdays</p>
            <p className={`text-2xl font-bold text-blue-600`}>{currency}{formatCurrency(analytics.weekdaySavings)}</p>
          </div>
        </div>
        <p className={`text-sm ${textSecondary} mt-3 text-center`}>
          {analytics.weekendSavings > analytics.weekdaySavings 
            ? 'You save more on weekends! 🎉'
            : 'You save more on weekdays! 💼'}
        </p>
      </div>

      {/* Savings Over Time (Line Chart) */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
        <h3 className={`font-semibold ${textColor} mb-4`}>Daily Savings (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={analytics.dailySavingsData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="date" 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Jar Distribution (Pie Chart) */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
        <h3 className={`font-semibold ${textColor} mb-4`}>Savings Distribution by Jar</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analytics.jarDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${currency}${formatCurrency(entry.value)}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {analytics.jarDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Savings (Bar Chart) */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
        <h3 className={`font-semibold ${textColor} mb-4`}>Weekly Comparison (Last 4 Weeks)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analytics.weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="week" 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
            />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000'
              }}
            />
            <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day of Week Heat Map */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
        <h3 className={`font-semibold ${textColor} mb-4`}>Saving Patterns by Day of Week</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analytics.dayOfWeekStats}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="day" 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: 'none',
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#000000'
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {analytics.dayOfWeekStats.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.day === analytics.bestSavingDay.day ? '#10b981' : '#6366f1'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month Comparison */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50'} rounded-2xl p-4`}>
        <h3 className={`font-semibold ${textColor} mb-3`}>Month-over-Month Growth</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 text-center`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Last Month</p>
            <p className={`text-2xl font-bold ${textColor}`}>{currency}{formatCurrency(analytics.lastMonthSavings)}</p>
          </div>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 text-center`}>
            <p className={`text-sm ${textSecondary} mb-1`}>This Month</p>
            <p className={`text-2xl font-bold ${textColor}`}>{currency}{formatCurrency(analytics.currentMonthSavings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
