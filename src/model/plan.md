Deep Q learning Plan 
1. Get State
    - Front Dist
    - Right Front Dist
    - Left Front Dist
    - Dist to Goal
    - velocity
    - acceleration
2. Input to NN, get action
    - accelerate 
    - break 
    - turn left
    - turn right
3. Perform action, get new state and reward 
    - distance to goal => smaller = big reward, bigger = bad
    - time alive => more bad as time goes on
    - at goal => HUGE AWARD
    - ran into wall => HUGE NEGATIVE REWARD
4. Update NN with reward 

    