          {campaigns.length === 0 ? (
            <Typography>No campaigns created yet.</Typography>
          ) : (
            <Grid container spacing={3}>
              {campaigns.map((campaign) => (
                <Grid 
                  key={campaign.id}
                  sx={{
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, 1fr)',
                      lg: 'repeat(3, 1fr)'
                    }
                  }}
                >
                  <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="h6">{campaign.name}</Typography>
                    <Typography variant="body2">ID: {campaign.id.toString()}</Typography>
                    <Typography variant="body2">Allowed Types: {campaign.allowedSchoolTypes.join(', ')}</Typography>
                    <Typography variant="body2">Allowed Standards: {campaign.allowedStandards.map(s => STANDARDS[s]).join(', ')}</Typography>
                    <Typography variant="body2">Exists: {campaign.exists ? 'Yes' : 'No'}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )} 