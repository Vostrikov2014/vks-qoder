import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { conferenceApi } from '../services/api';

interface DashboardStats {
  activeConferences: number;
  upcomingConferences: number;
  totalParticipants: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeConferences: 0,
    upcomingConferences: 0,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [activeRes, upcomingRes] = await Promise.all([
          conferenceApi.getActiveConferences(),
          conferenceApi.getUpcomingConferences(),
        ]);

        const activeConferences = activeRes.data.length;
        const upcomingConferences = upcomingRes.data.length;
        const totalParticipants = activeRes.data.reduce(
          (sum: number, conf: { currentParticipants?: number }) => 
            sum + (conf.currentParticipants || 0),
          0
        );

        setStats({
          activeConferences,
          upcomingConferences,
          totalParticipants,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Active Conferences',
      value: stats.activeConferences,
      icon: <VideoCallIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.light',
    },
    {
      title: 'Upcoming Conferences',
      value: stats.upcomingConferences,
      icon: <ScheduleIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.light',
    },
    {
      title: 'Active Participants',
      value: stats.totalParticipants,
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.light',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid key={card.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to Jitsi Management Platform
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your video conferences, users, and settings from this dashboard.
            Use the sidebar to navigate between different sections.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
