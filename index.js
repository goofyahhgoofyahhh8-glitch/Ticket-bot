const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ],
  partials: [Partials.Channel]
});

/* =========================
   SLASH COMMAND REGISTER
========================= */
const commands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a support ticket panel")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("Slash commands registered.");
  } catch (err) {
    console.error(err);
  }
});

/* =========================
   SLASH COMMAND HANDLER
========================= */
client.on(Events.InteractionCreate, async (interaction) => {

  // /ticket command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "ticket") {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel("🎫 Create Ticket")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        content: "Click below to open a ticket:",
        components: [row],
        ephemeral: false
      });
    }
  }

  // BUTTON HANDLER
  if (interaction.isButton()) {
    const guild = interaction.guild;

    // CREATE TICKET
    if (interaction.customId === "create_ticket") {
      const existing = guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.id}`
      );

      if (existing)
        return interaction.reply({
          content: "You already have an open ticket.",
          ephemeral: true
        });

      const channel = await guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }
        ]
      });

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Close Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `Welcome ${interaction.user}, support will assist you soon.`,
        components: [closeBtn]
      });

      return interaction.reply({
        content: `Ticket created: ${channel}`,
        ephemeral: true
      });
    }

    // CLOSE TICKET
    if (interaction.customId === "close_ticket") {
      await interaction.reply("Closing ticket...");
      setTimeout(() => interaction.channel.delete(), 3000);
    }
  }
});

client.login(process.env.TOKEN);
