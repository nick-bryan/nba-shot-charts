"""
Last updated: 12/21/2017

Script to pull shot data and photos for NBA players

NOTE: Python currently pulls all seasons, but HTML and d3.js only use 2017-18
"""

import datetime, requests, pandas as pd

# Output directory for json data and photos
data_dir_output = 'shot_chart_data/'
photo_dir_output = 'player_photos/'

# List of players in visual - IDs can be found on player pages at nba.com
players = {
    'LeBron James': 2544,
    'Giannis Antetokounmpo': 203507,
    'Kevin Durant': 201142,
    'Anthony Davis': 203076,
    'Stephen Curry': 201939,
    'James Harden': 201935,
    'Russell Westbrook': 201566,
    'Kyrie Irving': 202681,
    'Joel Embiid': 203954
	}

# Get current season
if datetime.datetime.now().month >= 11:
    ending_year = datetime.datetime.now().year+1
else:
    ending_year = datetime.datetime.now().year

# Function to pull player shot data	from nba.com
def player_shots(ID):
    ID_str = str(ID)
    agent={'User-Agent':'Chrome/56.0.2924.87'}
    
    # Get player's seasons
    player_info_url = 'http://stats.nba.com/stats/commonplayerinfo?LeagueID='\
        '00&PlayerID=' + ID_str + '&SeasonType=Regular+Season'       
    response = requests.get(player_info_url, headers=agent, timeout=15)
    first_season = int(response.json()['resultSets'][0]['rowSet'][0][-3])
    seasons = list(str(year) + '-' + str(year+1)[-2:] 
                   for year in range(first_season, ending_year))
    
    # Create shot dataset for player
    player_df = pd.DataFrame()
    
    for season in seasons:
        print(season)
        shots_url = 'http://stats.nba.com/stats/shotchartdetail?AheadBehind='\
        '&CFID=33&CFPARAMS=' + season + '&ClutchTime=&Conference='\
        '&ContextFilter=&ContextMeasure=FGA&DateFrom=&DateTo=&Division='\
        '&EndPeriod=10&EndRange=28800&GROUP_ID=&GameEventID=&GameID='\
        '&GameSegment=&GroupID=&GroupMode=&GroupQuantity=5&LastNGames=0'\
        '&LeagueID=00&Location=&Month=0&OnOff=&OpponentTeamID=0&Outcome='\
        '&PORound=0&Period=0&PlayerID=' + ID_str + '&PlayerID1=&PlayerID2='\
        '&PlayerID3=&PlayerID4=&PlayerID5=&PlayerPosition=&PointDiff='\
        '&Position=&RangeType=0&RookieYear=&Season=' + season + \
        '&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange='\
        '&StartPeriod=1&StartRange=0&StarterBench=&TeamID=0&VsConference='\
        '&VsDivision=&VsPlayerID1=&VsPlayerID2=&VsPlayerID3=&VsPlayerID4='\
        '&VsPlayerID5=&VsTeamID='
        
        shot_response = requests.get(shots_url, headers=agent, timeout=5)
        headers = shot_response.json()['resultSets'][0]['headers']
        shots = shot_response.json()['resultSets'][0]['rowSet']
        temp_player = pd.DataFrame(shots, columns=headers)
        temp_player['SEASON'] = season
        player_df = player_df.append(temp_player,ignore_index=True)
        
        # League averages from LeBron pull
        if ID == 2544:
            global league_avg
            headers_avg = shot_response.json()['resultSets'][1]['headers']
            shots_avg = shot_response.json()['resultSets'][1]['rowSet']
            temp_avg = pd.DataFrame(shots_avg, columns=headers_avg)
            temp_avg['SEASON'] = season
            league_avg = league_avg.append(temp_avg,ignore_index=True)
    
    return player_df

# Create shot datasets and pull player photos
shot_df = pd.DataFrame()
league_avg = pd.DataFrame()

for player in players:
    print(player)
    shot_df = shot_df.append(player_shots(players[player]),ignore_index=True)
    
    # Pull player photo
    r_photo = requests.get('https://ak-static.cms.nba.com/wp-content/uploads'\
        '/headshots/nba/latest/260x190/' + str(players[player]) + '.png')
    with open(photo_dir_output + player + '.png', 'wb') as f:
        f.write(r_photo.content)

# Reorder shot dataset columns
shot_df = shot_df[[
    'PLAYER_ID', 
    'PLAYER_NAME', 
    'TEAM_NAME', 
    'SHOT_ZONE_BASIC', 
    'SHOT_ZONE_AREA', 
    'SHOT_ZONE_RANGE', 
    'SHOT_DISTANCE',
    'LOC_X',
	 'LOC_Y', 
    'SHOT_MADE_FLAG',
    'SEASON'
    ]]

shot_df['SHOT_MADE_FLAG'] = shot_df['SHOT_MADE_FLAG'].astype(int)

# Calculate player stats by shot location
player_avg = shot_df.groupby([
        'PLAYER_ID', 
        'SEASON', 
        'SHOT_ZONE_BASIC', 
        'SHOT_ZONE_AREA',
        'SHOT_ZONE_RANGE'
    ]).agg({
        'SHOT_MADE_FLAG':['mean','sum','count']
    }).reset_index()

# Merge player-location stats with league-location stats and compare
player_avg_comp = pd.merge(
    player_avg, 
    league_avg, 
    how = 'inner', 
    on = ['SEASON', 'SHOT_ZONE_BASIC', 'SHOT_ZONE_AREA', 'SHOT_ZONE_RANGE']
    )

player_avg_comp.rename(
    columns={
            ('PLAYER_ID', ''):'PLAYER_ID',
            ('SHOT_MADE_FLAG', 'mean'): 'PLAYER_AVG',
            'FG_PCT': 'LEAGUE_AVG'
            }, 
    inplace=True
    )
    
player_avg_comp = player_avg_comp[[ 
    'SEASON',
    'SHOT_ZONE_BASIC',
    'SHOT_ZONE_AREA',
    'SHOT_ZONE_RANGE',
    'PLAYER_ID',
    'PLAYER_AVG',
    'LEAGUE_AVG'
    ]]

player_avg_comp['DIFF'] = (
    player_avg_comp['PLAYER_AVG'] - player_avg_comp['LEAGUE_AVG']
    )

# Merge league comparison stats onto all player shot data
shot_data_w_comp = pd.merge(
    shot_df, 
    player_avg_comp, 
    how = 'inner', 
    on = [
        'SEASON',
        'SHOT_ZONE_BASIC', 
        'SHOT_ZONE_AREA',
        'SHOT_ZONE_RANGE', 
        'PLAYER_ID'
        ]
    )
	
# Output to json to use in d3.js	
for player in players:
    subset = shot_data_w_comp[shot_data_w_comp['PLAYER_NAME'] == player]
    seasons = list(subset.SEASON.unique())
    for season in seasons:
        player_season = subset[subset['SEASON'] == season]
        player_season.to_json(
            path_or_buf = data_dir_output
            + player + ' ' + season + ' shots.json',
            orient='records'
            )
