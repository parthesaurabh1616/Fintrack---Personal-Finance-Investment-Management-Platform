import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  PhotoCamera,
  Save,
  Security,
  Notifications,
  Privacy,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { useMutation } from 'react-query';
import { authApi } from '../services/api';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    dataSharing: false,
    autoBackup: true,
  });

  const updateProfileMutation = useMutation(
    (data: any) => authApi.updateProfile(data),
    {
      onSuccess: (response) => {
        updateUser(response.user);
      },
    }
  );

  const updateSettingsMutation = useMutation(
    (data: any) => authApi.updateSettings(data),
    {
      onSuccess: () => {
        // Settings updated successfully
      },
    }
  );

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleSettingsChange = (setting: string, value: boolean) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Profile Information</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{ width: 80, height: 80, mr: 2 }}
                  src={user?.avatar}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <IconButton color="primary" component="label">
                    <PhotoCamera />
                    <input hidden accept="image/*" type="file" />
                  </IconButton>
                  <Typography variant="body2" color="textSecondary">
                    Change profile picture
                  </Typography>
                </Box>
              </Box>

              <form onSubmit={handleProfileSubmit}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  margin="normal"
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  sx={{ mt: 2 }}
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>

              {updateProfileMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Profile updated successfully!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Notifications sx={{ mr: 1 }} />
                <Typography variant="h6">Notification Settings</Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={(e) => handleSettingsChange('notifications', e.target.checked)}
                  />
                }
                label="Enable notifications"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailAlerts}
                    onChange={(e) => handleSettingsChange('emailAlerts', e.target.checked)}
                  />
                }
                label="Email alerts"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.smsAlerts}
                    onChange={(e) => handleSettingsChange('smsAlerts', e.target.checked)}
                  />
                }
                label="SMS alerts"
              />

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" mb={2}>
                <Privacy sx={{ mr: 1 }} />
                <Typography variant="h6">Privacy & Security</Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dataSharing}
                    onChange={(e) => handleSettingsChange('dataSharing', e.target.checked)}
                  />
                }
                label="Share anonymized data for analytics"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoBackup}
                    onChange={(e) => handleSettingsChange('autoBackup', e.target.checked)}
                  />
                }
                label="Automatic data backup"
              />

              <Button
                variant="outlined"
                color="error"
                sx={{ mt: 2 }}
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    // Handle account deletion
                  }
                }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Export & Import
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Export your financial data for backup or analysis purposes. You can also import data from other financial apps.
              </Typography>
              
              <Box display="flex" gap={2}>
                <Button variant="outlined">
                  Export Data (CSV)
                </Button>
                <Button variant="outlined">
                  Export Data (JSON)
                </Button>
                <Button variant="outlined" component="label">
                  Import Data
                  <input hidden accept=".csv,.json" type="file" />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API & Integrations
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Connect with external services and manage API access for third-party integrations.
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button variant="outlined">
                  Connect Bank Account
                </Button>
                <Button variant="outlined">
                  Connect Investment Broker
                </Button>
                <Button variant="outlined">
                  API Keys
                </Button>
                <Button variant="outlined">
                  Webhooks
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
