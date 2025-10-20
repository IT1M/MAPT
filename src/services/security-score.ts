import { prisma } from './prisma';
import { is2FAEnabled } from './two-factor';

/**
 * Security Score Calculation Service
 * Calculates user security score based on multiple factors
 */

export interface SecurityScoreFactors {
  passwordStrength: number; // 0-30 points
  twoFactorEnabled: number; // 0-25 points
  activeSessions: number; // 0-15 points
  recentSecurityEvents: number; // 0-15 points
  lastPasswordChange: number; // 0-15 points
}

export interface SecurityScore {
  total: number; // 0-100
  factors: SecurityScoreFactors;
  level: 'critical' | 'low' | 'medium' | 'good' | 'excellent';
  recommendations: string[];
  color: string;
}

export interface SecurityScoreHistory {
  date: Date;
  score: number;
}

/**
 * Calculate security score for a user
 */
export async function calculateSecurityScore(
  userId: string
): Promise<SecurityScore> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sessions: {
        where: {
          expires: {
            gt: new Date(),
          },
        },
      },
      activity_logs: {
        where: {
          event: {
            in: ['LOGIN', 'FAILED_LOGIN', 'PASSWORD_CHANGED', 'ACCOUNT_LOCKED'],
          },
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const factors: SecurityScoreFactors = {
    passwordStrength: 0,
    twoFactorEnabled: 0,
    activeSessions: 0,
    recentSecurityEvents: 0,
    lastPasswordChange: 0,
  };

  const recommendations: string[] = [];

  // 1. Password Strength (30 points)
  const passwordAge = user.passwordChangedAt
    ? Date.now() - user.passwordChangedAt.getTime()
    : Date.now() - user.createdAt.getTime();

  const daysSincePasswordChange = passwordAge / (24 * 60 * 60 * 1000);

  // Assume strong password if hash is bcrypt (length > 60)
  const hasStrongPassword = user.passwordHash.length > 60;

  if (hasStrongPassword && daysSincePasswordChange < 90) {
    factors.passwordStrength = 30;
  } else if (hasStrongPassword && daysSincePasswordChange < 180) {
    factors.passwordStrength = 20;
    recommendations.push(
      'Consider changing your password (last changed over 90 days ago)'
    );
  } else if (hasStrongPassword) {
    factors.passwordStrength = 15;
    recommendations.push(
      'Change your password (last changed over 180 days ago)'
    );
  } else {
    factors.passwordStrength = 10;
    recommendations.push('Use a stronger password with mixed characters');
  }

  // 2. Two-Factor Authentication (25 points)
  const has2FA = await is2FAEnabled(userId);

  if (has2FA) {
    factors.twoFactorEnabled = 25;
  } else {
    factors.twoFactorEnabled = 0;
    recommendations.push(
      'Enable two-factor authentication for enhanced security'
    );
  }

  // 3. Active Sessions (15 points)
  const sessionCount = user.sessions.length;

  if (sessionCount === 0) {
    factors.activeSessions = 15;
  } else if (sessionCount <= 2) {
    factors.activeSessions = 15;
  } else if (sessionCount <= 5) {
    factors.activeSessions = 10;
    recommendations.push(
      'You have multiple active sessions. Review and close unused sessions'
    );
  } else {
    factors.activeSessions = 5;
    recommendations.push(
      'Too many active sessions detected. Close unused sessions immediately'
    );
  }

  // 4. Recent Security Events (15 points)
  const failedLogins = user.activity_logs.filter(
    (log) => log.event === 'FAILED_LOGIN'
  ).length;

  const accountLocked = user.activity_logs.some(
    (log) => log.event === 'ACCOUNT_LOCKED'
  );

  if (failedLogins === 0 && !accountLocked) {
    factors.recentSecurityEvents = 15;
  } else if (failedLogins <= 3 && !accountLocked) {
    factors.recentSecurityEvents = 10;
    recommendations.push(
      'Some failed login attempts detected. Monitor your account activity'
    );
  } else if (accountLocked) {
    factors.recentSecurityEvents = 0;
    recommendations.push(
      'Your account was recently locked. Review security settings'
    );
  } else {
    factors.recentSecurityEvents = 5;
    recommendations.push(
      'Multiple failed login attempts detected. Change your password if suspicious'
    );
  }

  // 5. Last Password Change (15 points)
  if (daysSincePasswordChange < 30) {
    factors.lastPasswordChange = 15;
  } else if (daysSincePasswordChange < 90) {
    factors.lastPasswordChange = 12;
  } else if (daysSincePasswordChange < 180) {
    factors.lastPasswordChange = 8;
  } else if (daysSincePasswordChange < 365) {
    factors.lastPasswordChange = 4;
  } else {
    factors.lastPasswordChange = 0;
    recommendations.push('Password is very old. Change it immediately');
  }

  // Calculate total score
  const total = Object.values(factors).reduce((sum, value) => sum + value, 0);

  // Determine level and color
  let level: SecurityScore['level'];
  let color: string;

  if (total >= 90) {
    level = 'excellent';
    color = '#10b981'; // green
  } else if (total >= 70) {
    level = 'good';
    color = '#3b82f6'; // blue
  } else if (total >= 50) {
    level = 'medium';
    color = '#f59e0b'; // amber
  } else if (total >= 30) {
    level = 'low';
    color = '#ef4444'; // red
  } else {
    level = 'critical';
    color = '#dc2626'; // dark red
  }

  return {
    total,
    factors,
    level,
    recommendations,
    color,
  };
}

/**
 * Get security score history for a user
 */
export async function getSecurityScoreHistory(
  userId: string,
  days: number = 30
): Promise<SecurityScoreHistory[]> {
  // In a real implementation, you would store historical scores
  // For now, we'll return the current score
  const currentScore = await calculateSecurityScore(userId);

  const history: SecurityScoreHistory[] = [];
  const now = Date.now();

  // Generate sample historical data (in production, fetch from database)
  for (let i = days; i >= 0; i -= 7) {
    history.push({
      date: new Date(now - i * 24 * 60 * 60 * 1000),
      score: currentScore.total,
    });
  }

  return history;
}

/**
 * Get security recommendations based on score
 */
export function getSecurityRecommendations(score: SecurityScore): {
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}[] {
  const prioritized: {
    priority: 'high' | 'medium' | 'low';
    recommendations: string[];
  }[] = [];

  const high: string[] = [];
  const medium: string[] = [];
  const low: string[] = [];

  // Categorize recommendations by priority
  score.recommendations.forEach((rec) => {
    if (rec.includes('immediately') || rec.includes('Enable two-factor')) {
      high.push(rec);
    } else if (
      rec.includes('Change your password') ||
      rec.includes('Multiple failed')
    ) {
      medium.push(rec);
    } else {
      low.push(rec);
    }
  });

  if (high.length > 0) {
    prioritized.push({ priority: 'high', recommendations: high });
  }
  if (medium.length > 0) {
    prioritized.push({ priority: 'medium', recommendations: medium });
  }
  if (low.length > 0) {
    prioritized.push({ priority: 'low', recommendations: low });
  }

  return prioritized;
}

/**
 * Compare security scores
 */
export function compareSecurityScores(
  current: SecurityScore,
  previous: SecurityScore
): {
  change: number;
  improved: boolean;
  changedFactors: string[];
} {
  const change = current.total - previous.total;
  const improved = change > 0;

  const changedFactors: string[] = [];

  Object.keys(current.factors).forEach((key) => {
    const factorKey = key as keyof SecurityScoreFactors;
    if (current.factors[factorKey] !== previous.factors[factorKey]) {
      changedFactors.push(key);
    }
  });

  return {
    change,
    improved,
    changedFactors,
  };
}

/**
 * Get security score badge
 */
export function getSecurityScoreBadge(score: number): {
  text: string;
  color: string;
  icon: string;
} {
  if (score >= 90) {
    return {
      text: 'Excellent',
      color: 'green',
      icon: '🛡️',
    };
  } else if (score >= 70) {
    return {
      text: 'Good',
      color: 'blue',
      icon: '✅',
    };
  } else if (score >= 50) {
    return {
      text: 'Medium',
      color: 'amber',
      icon: '⚠️',
    };
  } else if (score >= 30) {
    return {
      text: 'Low',
      color: 'red',
      icon: '⚠️',
    };
  } else {
    return {
      text: 'Critical',
      color: 'red',
      icon: '🚨',
    };
  }
}
