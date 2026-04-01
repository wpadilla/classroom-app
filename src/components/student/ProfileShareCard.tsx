// ProfileShareCard — Off-screen credential card captured by html-to-image
// Renders a visually rich "student credential" card for sharing via Web Share API

import React, { forwardRef } from 'react';
import { IUser, IStudentEvaluation, IClassroomHistory } from '../../models';

interface ProfileShareCardProps {
  user: IUser;
  stats: {
    averageGrade: number;
    totalClasses: number;
    completedPrograms: number;
    currentEnrollments: number;
    attendanceRate: number;
  };
}

const ProfileShareCard = forwardRef<HTMLDivElement, ProfileShareCardProps>(
  ({ user, stats }, ref) => {
    const getGradeColor = (grade: number) => {
      if (grade >= 90) return '#10b981';
      if (grade >= 80) return '#3b82f6';
      if (grade >= 70) return '#f59e0b';
      return '#ef4444';
    };

    const gradeColor = getGradeColor(stats.averageGrade);

    return (
      <div
        ref={ref}
        style={{
          width: '400px',
          padding: '0',
          fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
          background: 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
        }}
      >
        {/* Header with logo */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo192.png"
              alt="Logo"
              style={{ width: '36px', height: '36px', borderRadius: '8px' }}
            />
            <div>
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                }}
              >
                AMOA
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px' }}>
                Academia de Ministros Oasis de Amor
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '4px 10px',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            {user.role === 'student' ? 'ESTUDIANTE' : user.role === 'teacher' ? 'PROFESOR' : 'ADMIN'}
          </div>
        </div>

        {/* Profile section */}
        <div
          style={{
            padding: '0 24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt="Profile"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            />
          ) : (
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(255,255,255,0.3)',
                fontSize: '28px',
                color: '#fff',
              }}
            >
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          )}
          <div>
            <div
              style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {user.firstName} {user.lastName}
            </div>
            {user.churchName && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
                <span style={{ marginRight: '4px' }}>⛪</span>
                {user.churchName}
              </div>
            )}
          </div>
        </div>

        {/* Stats section */}
        <div
          style={{
            background: '#ffffff',
            padding: '20px 24px 24px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          {/* Grade ring */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: `5px solid ${gradeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  background: `${gradeColor}10`,
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 800, color: gradeColor }}>
                  {stats.averageGrade.toFixed(0)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                Promedio General
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <StatBox icon="📚" value={stats.totalClasses} label="Clases Tomadas" />
            <StatBox icon="✅" value={stats.completedPrograms} label="Programas Terminados" />
            <StatBox icon="📝" value={stats.currentEnrollments} label="Inscritas Actualmente" />
            <StatBox icon="📋" value={`${stats.attendanceRate.toFixed(0)}%`} label="Asistencia" />
          </div>

          {/* Footer with watermark */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '12px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <img
              src="/logo192.png"
              alt=""
              style={{ width: '14px', height: '14px', borderRadius: '3px', opacity: 0.5 }}
            />
            <span style={{ fontSize: '9px', color: '#9ca3af' }}>
              Academia de Ministros Oasis de Amor • {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ProfileShareCard.displayName = 'ProfileShareCard';

// Internal helper
const StatBox: React.FC<{ icon: string; value: string | number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div
    style={{
      background: '#f9fafb',
      borderRadius: '12px',
      padding: '12px',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '16px', marginBottom: '4px' }}>{icon}</div>
    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a8a', lineHeight: 1.2 }}>
      {value}
    </div>
    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
  </div>
);

export default ProfileShareCard;
