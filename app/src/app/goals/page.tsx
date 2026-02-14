'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import {
  PlusIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface LearningGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_type: string;
  target_value: number;
  current_value: number;
  status: string;
  difficulty: string;
  xp_reward: number;
  deadline: string | null;
  created_at: number;
  completed_at: number | null;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'learning',
    target_type: 'documents',
    target_value: 10,
    difficulty: 'medium',
    deadline: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/goals');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to load goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  // Add this function at the top of the component
const calculateXP = () => {
  const difficultyMultipliers: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
  };
  
  const multiplier = difficultyMultipliers[newGoal.difficulty] || 2;
  const xp = newGoal.target_value * multiplier * 10;
  
  return xp;
};

// Alternative: Update XP preview in real-time
const updateXPPreview = () => {
  const xp = calculateXP();
  const preview = document.getElementById('xpPreview');
  if (preview) {
    preview.textContent = xp.toString();
  }
};

  const createGoal = async () => {
    if (!newGoal.title.trim()) {
      toast.error('Goal title is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal),
      });

      if (!response.ok) throw new Error('Failed to create goal');

      toast.success('Goal created! 🎯');
      setShowModal(false);
      setNewGoal({
        title: '',
        description: '',
        category: 'learning',
        target_type: 'documents',
        target_value: 10,
        difficulty: 'medium',
        deadline: '',
      });
      loadGoals();
    } catch (error) {
      console.error('Create goal error:', error);
      toast.error('Failed to create goal');
    }
  };

  const getProgress = (goal: LearningGoal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-amber-100 text-amber-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty] || colors.medium;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      learning: <ChartBarIcon className="w-5 h-5" />,
      reading: <ChartBarIcon className="w-5 h-5" />,
      productivity: <FireIcon className="w-5 h-5" />,
      skill: <TrophyIcon className="w-5 h-5" />,
    };
    return icons[category] || icons.learning;
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <MainLayout
      title="Learning Goals"
      description="Track your progress and achieve your learning objectives"
      headerActions={
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Goal
        </button>
      }
    >
      <div className="w-full mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <div className="text-3xl font-bold mb-1">{activeGoals.length}</div>
            <div className="text-sm opacity-90">Active Goals</div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-3xl font-bold mb-1">{completedGoals.length}</div>
            <div className="text-sm opacity-90">Completed</div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-3xl font-bold mb-1">
              {completedGoals.reduce((sum, g) => sum + g.xp_reward, 0)}
            </div>
            <div className="text-sm opacity-90">XP Earned</div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="text-3xl font-bold mb-1">
              {activeGoals.length > 0
                ? Math.round(
                    activeGoals.reduce((sum, g) => sum + getProgress(g), 0) / activeGoals.length
                  )
                : 0}%
            </div>
            <div className="text-sm opacity-90">Avg. Progress</div>
          </div>
        </div>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="card p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
                        {getCategoryIcon(goal.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(goal.difficulty)}`}>
                      {goal.difficulty}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {goal.current_value} / {goal.target_value} {goal.target_type}
                      </span>
                      <span className="font-semibold text-brand-600">
                        {Math.round(getProgress(goal))}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                        style={{ width: `${getProgress(goal)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrophyIcon className="w-4 h-4" />
                      <span>{goal.xp_reward} XP</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Goals 🎉</h2>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="card p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>Completed {new Date(goal.completed_at!).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>+{goal.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {goals.length === 0 && !loading && (
          <div className="card p-12 text-center">
            <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
            <p className="text-gray-600 mb-6">
              Set learning goals to track your progress and earn rewards!
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create Your First Goal
            </button>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Learning Goal</h2>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Title *
          </label>
          <input
            type="text"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            placeholder="e.g., Read 50 articles about AI"
            className="input w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            placeholder="What do you want to achieve?"
            rows={3}
            className="input w-full resize-none"
          />
        </div>

        {/* Category & Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="goalCategory"
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
              className="input w-full"
            >
              <option value="learning">Learning</option>
              <option value="reading">Reading</option>
              <option value="productivity">Productivity</option>
              <option value="skill">Skill Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              id="goalDifficulty"
              value={newGoal.difficulty}
              onChange={(e) => {
                setNewGoal({ ...newGoal, difficulty: e.target.value });
                updateXPPreview();
              }}
              className="input w-full"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Target */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Type
            </label>
            <select
              id="goalTargetType"
              value={newGoal.target_type}
              onChange={(e) => setNewGoal({ ...newGoal, target_type: e.target.value })}
              className="input w-full"
            >
              <option value="documents">Documents</option>
              <option value="words">Words Read</option>
              <option value="days">Days Active</option>
              <option value="topics">Topics Learned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Value
            </label>
            <input
              id="goalTargetValue"
              type="number"
              value={newGoal.target_value}
              onChange={(e) => {
                setNewGoal({ ...newGoal, target_value: parseInt(e.target.value) || 0 });
                updateXPPreview();
              }}
              min="1"
              className="input w-full"
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline (optional)
          </label>
          <input
            type="date"
            value={newGoal.deadline}
            onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            className="input w-full"
          />
        </div>

        {/* ⭐ XP PREVIEW - PUT IT HERE! ⭐ */}
        <div className="p-4 bg-brand-50 rounded-lg border border-brand-200">
          <div className="text-sm text-brand-800">
            <strong>Reward:</strong> <span id="xpPreview">{calculateXP()}</span> XP on completion 🏆
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex gap-3">
        <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">
          Cancel
        </button>
        <button onClick={createGoal} className="btn-primary flex-1">
          Create Goal
        </button>
      </div>
    </div>
  </div>
)}
    </MainLayout>
  );
}