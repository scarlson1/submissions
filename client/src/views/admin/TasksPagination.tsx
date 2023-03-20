import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { useUser } from 'reactfire';

import { ServerDataGrid } from 'components';
import { columns, useGenerateTasks } from './TestDataGridPagination';

export const TasksPagination: React.FC = () => {
  const { status, data: user } = useUser();
  const generateTasks = useGenerateTasks();

  if (status === 'loading') return <div>Loading...</div>;
  if (!user?.uid) return <div>missing user id</div>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2 }}>
        <Typography variant='h5' gutterBottom>
          Tasks
        </Typography>
        <Button
          onClick={() => generateTasks(10)}
          variant='contained'
          size='small'
          sx={{ maxHeight: 34 }}
        >
          Generate tasks
        </Button>
      </Box>
      <ServerDataGrid
        collName='TASKS'
        columns={columns}
        constraints={[where('userId', '==', user?.uid)]}
      />
    </Box>
  );
};
