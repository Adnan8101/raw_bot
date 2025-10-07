import { Interaction } from 'discord.js';
import { client } from '../index';
import { handleButtonInteraction } from './buttonInteraction';
import { handleModalSubmit } from './modalSubmit';

export async function handleInteractionCreate(interaction: Interaction) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      const errorMessage = '❌ There was an error executing this command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  }

  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
  }
}
